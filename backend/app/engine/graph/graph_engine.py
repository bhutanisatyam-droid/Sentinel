import networkx as nx
from datetime import datetime, timedelta
from collections import defaultdict


class TransactionGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.communities = []

    def build_graph(self, transactions: list[dict], user_profiles: dict = None):
        if user_profiles is None:
            user_profiles = {}
            
        self.graph.clear()
        
        for txn in transactions:
            source = txn.get("user_id")
            target = txn.get("counterparty_id")
            
            if not source or not target:
                continue
            
            # Add Source
            if not self.graph.has_node(source):
                prof = user_profiles.get(source, {})
                self.graph.add_node(source, 
                    risk_score=prof.get("risk_score", 0.0),
                    tier=prof.get("tier", "standard"),
                    occupation=prof.get("occupation", "unknown"),
                    device_id=prof.get("device_id"),
                    ip_address=prof.get("ip_address"),
                    phone=prof.get("phone"),
                )
                
            # Add Target
            if not self.graph.has_node(target):
                prof = user_profiles.get(target, {})
                self.graph.add_node(target, 
                    risk_score=prof.get("risk_score", 0.0),
                    tier=prof.get("tier", "standard"),
                    occupation=prof.get("occupation", "unknown"),
                    device_id=prof.get("device_id"),
                    ip_address=prof.get("ip_address"),
                    phone=prof.get("phone"),
                )
                
            # Add Edge
            self.graph.add_edge(source, target,
                amount=txn.get("amount", 0.0),
                timestamp=txn.get("timestamp") or txn.get("created_at"),
                transaction_id=txn.get("transaction_id") or txn.get("id"),
                flagged=txn.get("flagged", False),
                edge_type="TRANSACTION",
            )

        # Shared attribute linking — synthetic identity ring detection
        self._add_shared_attribute_edges()

        # Compute Node Metrics
        if len(self.graph) > 0:
            in_degrees = dict(self.graph.in_degree())
            out_degrees = dict(self.graph.out_degree())
            pagerank = nx.pagerank(self.graph, weight='amount')
            betweenness = nx.betweenness_centrality(self.graph)

            for node in self.graph.nodes:
                self.graph.nodes[node]['in_degree'] = in_degrees.get(node, 0)
                self.graph.nodes[node]['out_degree'] = out_degrees.get(node, 0)
                self.graph.nodes[node]['pagerank'] = pagerank.get(node, 0.0)
                self.graph.nodes[node]['betweenness_centrality'] = betweenness.get(node, 0.0)

            # Precompute communities for performance
            self.communities = self.detect_communities()

    # ─── Shared Attribute Linking ─────────────────────────────────────

    def _add_shared_attribute_edges(self):
        """
        Creates synthetic edges between nodes sharing the same device_id,
        ip_address, or phone number.  These catch synthetic identity rings
        where multiple "independent" accounts are controlled by one actor.
        """
        attribute_groups: dict[str, dict[str, list[str]]] = {
            "device_id": defaultdict(list),
            "ip_address": defaultdict(list),
            "phone": defaultdict(list),
        }

        for node_id, data in self.graph.nodes(data=True):
            for attr_name, groups in attribute_groups.items():
                val = data.get(attr_name)
                if val:
                    groups[val].append(node_id)

        for attr_name, groups in attribute_groups.items():
            for attr_val, node_ids in groups.items():
                if len(node_ids) < 2:
                    continue
                # Create bidirectional edges between all nodes sharing this attribute
                for i in range(len(node_ids)):
                    for j in range(i + 1, len(node_ids)):
                        a, b = node_ids[i], node_ids[j]
                        # Only add if this specific shared-attribute edge doesn't exist
                        if not self.graph.has_edge(a, b) or \
                           self.graph[a][b].get("edge_type") != "SHARED_ATTRIBUTE":
                            self.graph.add_edge(a, b,
                                amount=0.0,
                                edge_type="SHARED_ATTRIBUTE",
                                shared_attribute=attr_name,
                                shared_value=attr_val,
                                flagged=True,
                            )

    # ─── Cycle Detection with Time Window ─────────────────────────────

    def detect_cycles(self, max_length: int = 5, time_window_hours: int = 72) -> list[dict]:
        """
        Detect cycles up to `max_length` hops.  Optionally filters to only
        cycles whose transactions all fall within `time_window_hours`.
        Returns list of dicts: {nodes, total_amount, window_hours}.
        """
        raw_cycles = nx.simple_cycles(self.graph)
        valid_cycles = []
        
        for cycle in raw_cycles:
            if len(cycle) > max_length:
                continue

            # Skip cycles that are purely shared-attribute edges
            all_shared = True
            total_amount = 0.0
            timestamps = []

            for i in range(len(cycle)):
                u = cycle[i]
                v = cycle[(i + 1) % len(cycle)]
                edge_data = self.graph.get_edge_data(u, v)
                if not edge_data:
                    break
                if edge_data.get("edge_type") != "SHARED_ATTRIBUTE":
                    all_shared = False
                total_amount += edge_data.get('amount', 0.0)
                ts = edge_data.get('timestamp')
                if ts:
                    timestamps.append(ts)

            if all_shared:
                continue

            # Time-window filtering
            window_hours = None
            if len(timestamps) >= 2:
                parsed = []
                for ts in timestamps:
                    if isinstance(ts, str):
                        try:
                            parsed.append(datetime.fromisoformat(ts.replace('Z', '+00:00')))
                        except (ValueError, TypeError):
                            pass
                    elif isinstance(ts, datetime):
                        parsed.append(ts)

                if len(parsed) >= 2:
                    span = max(parsed) - min(parsed)
                    window_hours = round(span.total_seconds() / 3600, 1)
                    if window_hours > time_window_hours:
                        continue  # Cycle spans too long — skip

            valid_cycles.append({
                "nodes": cycle,
                "total_amount": total_amount,
                "window_hours": window_hours,
            })
                
        # Sort by total amount descending
        valid_cycles.sort(key=lambda x: x["total_amount"], reverse=True)
        return valid_cycles

    # ─── Fan Pattern Detection ────────────────────────────────────────

    def detect_fan_patterns(self, threshold: int = 5) -> dict:
        fan_out = []
        fan_in = []
        
        for node in self.graph.nodes:
            # Count only TRANSACTION edges, not SHARED_ATTRIBUTE
            out_edges = [(u, v, d) for u, v, d in self.graph.out_edges(node, data=True)
                         if d.get("edge_type") != "SHARED_ATTRIBUTE"]
            in_edges = [(u, v, d) for u, v, d in self.graph.in_edges(node, data=True)
                        if d.get("edge_type") != "SHARED_ATTRIBUTE"]

            out_deg = len(out_edges)
            in_deg = len(in_edges)
            
            if out_deg > threshold:
                total_out = sum(d['amount'] for _, _, d in out_edges)
                fan_out.append({"node": node, "out_degree": out_deg, "total_amount": total_out})
                
            if in_deg > threshold:
                total_in = sum(d['amount'] for _, _, d in in_edges)
                fan_in.append({"node": node, "in_degree": in_deg, "total_amount": total_in})
                
        return {"fan_out": fan_out, "fan_in": fan_in}

    # ─── Community Detection ──────────────────────────────────────────

    def detect_communities(self) -> list[set]:
        undirected_graph = self.graph.to_undirected()
        if len(undirected_graph) == 0:
            return []
        try:
            return list(nx.community.louvain_communities(undirected_graph))
        except AttributeError:
            # Fallback if specific networkx version doesn't support it directly
            return []

    # ─── Per-Node Risk Signals ────────────────────────────────────────

    def get_node_risk_signals(self, node_id: str) -> dict:
        if not self.graph.has_node(node_id):
            return {}

        node_data = self.graph.nodes[node_id]
        
        # Check cycles
        cycles = self.detect_cycles()
        node_cycles = [c["nodes"] for c in cycles if node_id in c["nodes"]]
        in_cycle = len(node_cycles) > 0
        
        # Community
        community_id = -1
        for i, comm in enumerate(self.communities):
            if node_id in comm:
                community_id = i
                break

        # Fan patterns (only transaction edges)
        tx_out = sum(1 for _, _, d in self.graph.out_edges(node_id, data=True)
                     if d.get("edge_type") != "SHARED_ATTRIBUTE")
        tx_in = sum(1 for _, _, d in self.graph.in_edges(node_id, data=True)
                    if d.get("edge_type") != "SHARED_ATTRIBUTE")

        # Shared attributes
        shared_attrs = []
        for _, target, d in self.graph.out_edges(node_id, data=True):
            if d.get("edge_type") == "SHARED_ATTRIBUTE":
                shared_attrs.append({
                    "linked_node": target,
                    "attribute": d.get("shared_attribute"),
                })
        for source, _, d in self.graph.in_edges(node_id, data=True):
            if d.get("edge_type") == "SHARED_ATTRIBUTE":
                shared_attrs.append({
                    "linked_node": source,
                    "attribute": d.get("shared_attribute"),
                })

        return {
            "in_degree": node_data.get('in_degree', 0),
            "out_degree": node_data.get('out_degree', 0),
            "in_cycle": in_cycle,
            "cycle_details": node_cycles,
            "pagerank": node_data.get('pagerank', 0.0),
            "betweenness_centrality": node_data.get('betweenness_centrality', 0.0),
            "community_id": community_id,
            "is_fan_out": tx_out > 5,
            "is_fan_in": tx_in > 5,
            "shared_attributes": shared_attrs,
        }

    # ─── Serialization for Frontend ───────────────────────────────────

    def serialize_for_frontend(self) -> dict:
        cycles = self.detect_cycles()
        cycle_node_set = set()
        for c in cycles:
            for n in c["nodes"]:
                cycle_node_set.add(n)

        # Build community lookup
        community_lookup: dict[str, int] = {}
        for i, comm in enumerate(self.communities):
            for node_id in comm:
                community_lookup[node_id] = i

        fan_patterns = self.detect_fan_patterns()
        fan_node_set = set()
        for f in fan_patterns.get("fan_out", []):
            fan_node_set.add(f["node"])
        for f in fan_patterns.get("fan_in", []):
            fan_node_set.add(f["node"])

        # Nodes
        nodes = []
        for n, data in self.graph.nodes(data=True):
            nodes.append({
                "id": n,
                "label": n,
                "riskScore": data.get("risk_score", 0.0),
                "tier": data.get("tier", "standard"),
                "inDegree": data.get("in_degree", 0),
                "outDegree": data.get("out_degree", 0),
                "pagerank": round(data.get("pagerank", 0.0), 6),
                "betweenness": round(data.get("betweenness_centrality", 0.0), 6),
                "communityId": community_lookup.get(n, -1),
                "inCycle": n in cycle_node_set,
                "isFanNode": n in fan_node_set,
            })

        # Edges
        cycle_edge_set = set()
        for c in cycles:
            cnodes = c["nodes"]
            for i in range(len(cnodes)):
                u = cnodes[i]
                v = cnodes[(i + 1) % len(cnodes)]
                cycle_edge_set.add((u, v))

        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "amount": data.get("amount", 0.0),
                "timestamp": data.get("timestamp"),
                "flagged": data.get("flagged", False),
                "edgeType": data.get("edge_type", "TRANSACTION"),
                "sharedAttribute": data.get("shared_attribute"),
                "isCycle": (u, v) in cycle_edge_set,
            })

        # Flatten cycles for frontend
        cycle_list = []
        for c in cycles:
            cycle_list.append({
                "nodes": c["nodes"],
                "totalAmount": c["total_amount"],
                "windowHours": c.get("window_hours"),
            })

        # Communities as lists for JSON serialization
        communities_list = [list(comm) for comm in self.communities]

        return {
            "nodes": nodes,
            "edges": edges,
            "cycles": cycle_list,
            "communities": communities_list,
            "fanPatterns": fan_patterns,
            "stats": {
                "nodeCount": len(nodes),
                "edgeCount": len(edges),
                "cycleCount": len(cycle_list),
                "communityCount": len(communities_list),
            },
        }

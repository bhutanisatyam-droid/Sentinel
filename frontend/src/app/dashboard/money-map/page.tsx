'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/shared/lib/utils';
import { SeverityBadge } from '@/shared/components/ui/severity-badge';
import {
  Maximize2,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RefreshCw,
  RefreshCcw,
  Filter,
  Eye,
  EyeOff,
  Link2,
  Play,
  Globe,
} from 'lucide-react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Dynamic import â€” react-force-graph-2d is not SSR-compatible
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[#666666] text-sm">
      Initialising graph engineâ€¦
    </div>
  ),
});

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Types
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface GraphNode {
  id: string;
  riskScore: number;
  tier: string;
  label: string;
  inCycle: boolean;
  isFanNode?: boolean;
  communityId: number;
  inDegree: number;
  outDegree: number;
  pagerank?: number;
  betweenness?: number;
  // force-graph internal
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  amount: number;
  isCycle: boolean;
  edgeType?: string;
  sharedAttribute?: string;
  flagged?: boolean;
}

interface CycleInfo {
  nodes: string[];
  totalAmount: number;
  windowHours: number | null;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface APIResponse {
  nodes: GraphNode[];
  edges: GraphLink[];
  cycles: CycleInfo[];
  communities: string[][];
  fanPatterns: { fan_out: { node: string; out_degree: number; total_amount: number }[]; fan_in: { node: string; in_degree: number; total_amount: number }[] };
  stats: { nodeCount: number; edgeCount: number; cycleCount: number; communityCount: number };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Fallback Demo Data (used if API is unavailable)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function buildFallbackDemo(): { graphData: GraphData; cycles: CycleInfo[]; communities: string[][]; stats: APIResponse['stats'] } {
  const nodes: GraphNode[] = [
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `U-${String(i + 1).padStart(3, '0')}`,
      riskScore: Math.floor(Math.random() * 20),
      tier: 'GREEN' as const,
      label: `User ${i + 1}`,
      inCycle: false,
      isFanNode: false,
      communityId: 0,
      inDegree: Math.floor(Math.random() * 4),
      outDegree: Math.floor(Math.random() * 4),
    })),
    // Cycle ring
    { id: 'U-101', riskScore: 78, tier: 'RED', label: 'V*** S***', inCycle: true, isFanNode: false, communityId: 1, inDegree: 1, outDegree: 1 },
    { id: 'U-102', riskScore: 72, tier: 'RED', label: 'Node B',   inCycle: true, isFanNode: false, communityId: 1, inDegree: 1, outDegree: 1 },
    { id: 'U-103', riskScore: 69, tier: 'RED', label: 'Node C',   inCycle: true, isFanNode: false, communityId: 1, inDegree: 1, outDegree: 1 },
    { id: 'U-104', riskScore: 74, tier: 'RED', label: 'Node D',   inCycle: true, isFanNode: false, communityId: 1, inDegree: 1, outDegree: 1 },
    { id: 'U-105', riskScore: 71, tier: 'RED', label: 'Node E',   inCycle: true, isFanNode: false, communityId: 1, inDegree: 1, outDegree: 1 },
    // Fan-in mule + sources
    { id: 'MULE-01', riskScore: 92, tier: 'RED', label: 'P*** M***', inCycle: false, isFanNode: true, communityId: 2, inDegree: 8, outDegree: 1 },
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `FAN-${i + 1}`,
      riskScore: 25 + Math.floor(Math.random() * 20),
      tier: 'YELLOW' as const,
      label: `Source ${i + 1}`,
      inCycle: false,
      isFanNode: false,
      communityId: 2,
      inDegree: 0,
      outDegree: 1,
    })),
    // Shared device cluster (Ring 3)
    { id: 'DEV-01', riskScore: 55, tier: 'YELLOW', label: 'Acct X1', inCycle: false, isFanNode: false, communityId: 3, inDegree: 1, outDegree: 1 },
    { id: 'DEV-02', riskScore: 58, tier: 'YELLOW', label: 'Acct X2', inCycle: false, isFanNode: false, communityId: 3, inDegree: 1, outDegree: 1 },
    { id: 'DEV-03', riskScore: 52, tier: 'YELLOW', label: 'Acct X3', inCycle: false, isFanNode: false, communityId: 3, inDegree: 1, outDegree: 1 },
    { id: 'DEV-04', riskScore: 60, tier: 'YELLOW', label: 'Acct X4', inCycle: false, isFanNode: false, communityId: 3, inDegree: 1, outDegree: 1 },
  ];

  const links: GraphLink[] = [
    ...Array.from({ length: 30 }, () => {
      const src = Math.floor(Math.random() * 20);
      let tgt = Math.floor(Math.random() * 20);
      while (tgt === src) tgt = Math.floor(Math.random() * 20);
      return {
        source: `U-${String(src + 1).padStart(3, '0')}`,
        target: `U-${String(tgt + 1).padStart(3, '0')}`,
        amount: Math.random() * 30000 + 1000,
        isCycle: false,
        edgeType: 'TRANSACTION',
      };
    }),
    // Cycle edges
    { source: 'U-101', target: 'U-102', amount: 200000, isCycle: true, edgeType: 'TRANSACTION' },
    { source: 'U-102', target: 'U-103', amount: 195000, isCycle: true, edgeType: 'TRANSACTION' },
    { source: 'U-103', target: 'U-104', amount: 190000, isCycle: true, edgeType: 'TRANSACTION' },
    { source: 'U-104', target: 'U-105', amount: 188000, isCycle: true, edgeType: 'TRANSACTION' },
    { source: 'U-105', target: 'U-101', amount: 185000, isCycle: true, edgeType: 'TRANSACTION' },
    // Fan-in edges
    ...Array.from({ length: 8 }, (_, i) => ({
      source: `FAN-${i + 1}`,
      target: 'MULE-01',
      amount: 25000 + i * 1000,
      isCycle: false,
      edgeType: 'TRANSACTION',
    })),
    // Shared device edges (Ring 3)
    { source: 'DEV-01', target: 'DEV-02', amount: 0, isCycle: false, edgeType: 'SHARED_ATTRIBUTE', sharedAttribute: 'device_id' },
    { source: 'DEV-02', target: 'DEV-03', amount: 0, isCycle: false, edgeType: 'SHARED_ATTRIBUTE', sharedAttribute: 'device_id' },
    { source: 'DEV-03', target: 'DEV-04', amount: 0, isCycle: false, edgeType: 'SHARED_ATTRIBUTE', sharedAttribute: 'device_id' },
    { source: 'DEV-01', target: 'DEV-03', amount: 0, isCycle: false, edgeType: 'SHARED_ATTRIBUTE', sharedAttribute: 'device_id' },
    // Normal txns from device cluster
    { source: 'DEV-01', target: 'U-001', amount: 15000, isCycle: false, edgeType: 'TRANSACTION' },
    { source: 'DEV-02', target: 'U-003', amount: 18000, isCycle: false, edgeType: 'TRANSACTION' },
  ];

  const cycles: CycleInfo[] = [
    { nodes: ['U-101', 'U-102', 'U-103', 'U-104', 'U-105'], totalAmount: 958000, windowHours: 9 },
  ];

  const communities = [
    nodes.filter(n => n.communityId === 0).map(n => n.id),
    nodes.filter(n => n.communityId === 1).map(n => n.id),
    nodes.filter(n => n.communityId === 2).map(n => n.id),
    nodes.filter(n => n.communityId === 3).map(n => n.id),
  ];

  return {
    graphData: { nodes, links },
    cycles,
    communities,
    stats: { nodeCount: nodes.length, edgeCount: links.length, cycleCount: 1, communityCount: 4 },
  };
}

/* â”€â”€â”€ Colour helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function tierColor(tier: string) {
  switch (tier) {
    case 'GREEN':     return '#00C853';
    case 'YELLOW':    return '#FFB300';
    case 'RED':       return '#FF1744';
    case 'BLACKLIST': return '#FFFFFF';
    case 'standard':  return '#00C853';
    default:          return '#666666';
  }
}

function scoreColor(s: number) {
  if (s >= 100) return '#FFFFFF';
  if (s > 60)   return '#FF1744';
  if (s >= 25)  return '#FFB300';
  return '#00C853';
}

function scoreTier(s: number): 'critical' | 'high' | 'medium' | 'low' {
  if (s >= 80) return 'critical';
  if (s > 60)  return 'high';
  if (s >= 25) return 'medium';
  return 'low';
}

function fmtAmount(n: number) {
  if (n >= 100000) return `â‚¹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `â‚¹${(n / 1000).toFixed(1)}K`;
  return `â‚¹${n}`;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   API Fetcher
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const API_BASE = '';

async function fetchMoneyMap(): Promise<APIResponse | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/dashboard/money-map?days=90`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Page Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function MoneyMapPage() {
  /* â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [cycles, setCycles] = useState<CycleInfo[]>([]);
  const [communities, setCommunities] = useState<string[][]>([]);
  const [apiStats, setApiStats] = useState<APIResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('api');
  const [runningDemo, setRunningDemo] = useState(false);
  const [runningGeoDemo, setRunningGeoDemo] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const resp = await fetchMoneyMap();
    if (resp) {
      // API succeeded â€” even if nodes are empty
      setGraphData({
        nodes: resp.nodes || [],
        links: (resp.edges || []).map(e => ({ ...e, isCycle: e.isCycle ?? false })),
      });
      setCycles(resp.cycles ?? []);
      setCommunities(resp.communities ?? []);
      setApiStats(resp.stats);
      setDataSource('api');
    } else {
      // Fallback to demo data ONLY if fetch actually fails and returns null
      const demo = buildFallbackDemo();
      setGraphData(demo.graphData);
      setCycles(demo.cycles);
      setCommunities(demo.communities);
      setApiStats(demo.stats);
      setDataSource('fallback');
      setError('API unavailable â€” showing demo data');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoverNode, setHoverNode]       = useState<GraphNode | null>(null);
  const [showCycles, setShowCycles]     = useState(true);
  const [showFan, setShowFan]           = useState(true);
  const [showLabels, setShowLabels]     = useState(false);
  const [showSharedAttr, setShowSharedAttr] = useState(true);
  const [mounted, setMounted]           = useState(false);
  const [isolatedCommunity, setIsolatedCommunity] = useState<number | null>(null);
  const [pulseTime, setPulseTime]       = useState(0);

  const handleRunDemo = async () => {
    setRunningDemo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/dashboard/run-demo`, { method: 'POST', headers });
      
      // Notify user via a small floating notification or console
      console.log('Demo started. Will complete in ~35s.');
      // Optional: auto-refresh after 40 seconds
      setTimeout(() => loadData(), 40000);
    } catch (e) {
      console.error('Failed to run demo:', e);
    } finally {
      setTimeout(() => setRunningDemo(false), 2000);
    }
  };

  const handleRunGeoDemo = async () => {
    setRunningGeoDemo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/dashboard/run-geo-demo`, { method: 'POST', headers });
      
      console.log('Geo Demo started. Will complete in ~5s.');
      setTimeout(() => loadData(), 5000);
    } catch (e) {
      console.error('Failed to run geo demo:', e);
    } finally {
      setTimeout(() => setRunningGeoDemo(false), 2000);
    }
  };

  const handleResetDemo = async () => {
    setResettingDemo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/dashboard/reset-demo`, { method: 'POST', headers });
      
      console.log('Reset started. Will complete in ~5s.');
      setTimeout(() => loadData(), 5000);
    } catch (e) {
      console.error('Failed to reset demo:', e);
    } finally {
      setTimeout(() => setResettingDemo(false), 2000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  // Pulsing animation â€” tick every 50ms
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTime(t => t + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  /* â”€â”€ Filtered data (for cluster isolation) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const filteredGraphData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };
    if (isolatedCommunity === null) return graphData;

    const communityNodes = communities[isolatedCommunity];
    if (!communityNodes) return graphData;
    const nodeSet = new Set(communityNodes);

    const nodes = graphData.nodes.filter(n => nodeSet.has(n.id));
    const links = graphData.links.filter(l => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      return nodeSet.has(src) && nodeSet.has(tgt);
    });

    return { nodes, links };
  }, [graphData, isolatedCommunity, communities]);

  /* â”€â”€ Neighbour set for hover highlighting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const hoverNeighbours = useMemo(() => {
    if (!hoverNode || !filteredGraphData) return new Set<string>();
    const ids = new Set<string>();
    filteredGraphData.links.forEach((l) => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      if (src === hoverNode.id) ids.add(tgt);
      if (tgt === hoverNode.id) ids.add(src);
    });
    ids.add(hoverNode.id);
    return ids;
  }, [hoverNode, filteredGraphData]);

  /* â”€â”€ Node neighbours (for detail panel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const selectedNeighbourLinks = useMemo(() => {
    if (!selectedNode || !filteredGraphData) return [];
    return filteredGraphData.links.filter((l) => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      return src === selectedNode.id || tgt === selectedNode.id;
    });
  }, [selectedNode, filteredGraphData]);

  /* â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 600);
      fgRef.current.zoom(3, 600);
    }
  }, []);

  const handleZoomToFit = useCallback(() => {
    fgRef.current?.zoomToFit(400, 60);
  }, []);

  const handleIsolateCommunity = useCallback((communityIdx: number | null) => {
    setIsolatedCommunity(communityIdx);
    setSelectedNode(null);
    // zoom to fit after a brief delay for layout
    setTimeout(() => fgRef.current?.zoomToFit(400, 60), 300);
  }, []);

  /* â”€â”€ Cycle sets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const cycleIds = useMemo(() => {
    const s = new Set<string>();
    cycles.forEach(c => c.nodes.forEach(n => s.add(n)));
    return s;
  }, [cycles]);

  /* â”€â”€ Fan-in node set â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fanIds = useMemo(() => {
    if (!graphData) return new Set<string>();
    const s = new Set<string>();
    graphData.nodes.forEach(n => { if (n.isFanNode) s.add(n.id); });
    return s;
  }, [graphData]);

  /* â”€â”€ Custom node rendering with PULSING ANIMATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const paintNode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      if (node.x == null || node.y == null) return; // skip until simulation assigns positions
      const baseR = Math.max(4, Math.min(16, (((n.inDegree ?? 0) + (n.outDegree ?? 0) + 1) / 20) * 16));
      let r = baseR / Math.sqrt(globalScale);
      const color = tierColor(n.tier);

      // Dim unrelated nodes when hovering
      const dimmed = hoverNode && !hoverNeighbours.has(n.id);
      const alpha = dimmed ? 0.12 : 1;

      // â”€â”€ PULSING ANIMATION for flagged/cycle/high-risk nodes â”€â”€
      const shouldPulse = !dimmed && (n.inCycle || n.riskScore > 60 || n.isFanNode);
      if (shouldPulse) {
        const pulse = Math.sin(pulseTime * 0.1) * 0.3 + 0.7; // 0.4..1.0
        const pulseR = r + (4 / globalScale) * pulse;

        // Outer pulsing glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR + 2 / globalScale, 0, 2 * Math.PI);
        const glowAlpha = Math.round(pulse * 0.25 * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = color + glowAlpha;
        ctx.fill();

        // Secondary pulse ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, 2 * Math.PI);
        const ringAlpha = Math.round(pulse * 0.4 * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = color + ringAlpha;
        ctx.fill();
      } else if (!dimmed) {
        // Static glow for fan/cycle nodes (non-pulsing, e.g. when filters off)
        const shouldGlow =
          (showCycles && n.inCycle) ||
          (showFan && fanIds.has(n.id));
        if (shouldGlow) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4 / globalScale, 0, 2 * Math.PI);
          ctx.fillStyle = color + Math.round(0.2 * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();

      // Selected ring
      if (selectedNode?.id === n.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3 / globalScale, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      // Label
      if (showLabels || hoverNode?.id === n.id || selectedNode?.id === n.id) {
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = dimmed ? 'rgba(237,237,237,0.15)' : 'rgba(237,237,237,0.85)';
        ctx.fillText(n.id, node.x, node.y + r + 3 / globalScale);
      }
    },
    [hoverNode, hoverNeighbours, selectedNode, showLabels, showCycles, showFan, fanIds, pulseTime],
  );

  /* â”€â”€ Custom link rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const paintLink = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const l = link as GraphLink & { source: GraphNode; target: GraphNode };
      if (!l.source || !l.target) return;
      const sx = l.source.x ?? 0;
      const sy = l.source.y ?? 0;
      const tx = l.target.x ?? 0;
      const ty = l.target.y ?? 0;
      if (sx === 0 && sy === 0 && tx === 0 && ty === 0) return;

      const isSharedAttr = l.edgeType === 'SHARED_ATTRIBUTE';
      if (isSharedAttr && !showSharedAttr) return; // hide if toggled off

      const w = isSharedAttr
        ? 1 / globalScale
        : Math.max(0.5, Math.min(3, ((l.amount ?? 0) / 200000) * 3));
      const isCycleEdge = showCycles && l.isCycle;

      // Determine if this edge is connected to hovered node
      const hoverConnected =
        hoverNode &&
        (l.source?.id === hoverNode.id || l.target?.id === hoverNode.id);

      let alpha = 1;
      if (hoverNode && !hoverConnected) alpha = 0.06;

      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);

      if (isSharedAttr) {
        // Dotted cyan line for shared attributes
        ctx.strokeStyle = `rgba(0, 188, 212, ${alpha * 0.6})`;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.setLineDash([3 / globalScale, 3 / globalScale]);
      } else if (isCycleEdge) {
        ctx.strokeStyle = `rgba(255, 23, 68, ${alpha})`;
        ctx.lineWidth = (w + 1) / globalScale;
        ctx.setLineDash([5 / globalScale, 3 / globalScale]);
      } else {
        ctx.strokeStyle = `rgba(31, 31, 31, ${Math.max(alpha, 0.3)})`;
        ctx.lineWidth = w / globalScale;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow head (skip for shared attribute edges)
      if (!isSharedAttr) {
        const arrowLen = 5 / globalScale;
        const dx = tx - sx;
        const dy = ty - sy;
        const angle = Math.atan2(dy, dx);
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;

        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX - arrowLen * Math.cos(angle - Math.PI / 7),
          midY - arrowLen * Math.sin(angle - Math.PI / 7),
        );
        ctx.lineTo(
          midX - arrowLen * Math.cos(angle + Math.PI / 7),
          midY - arrowLen * Math.sin(angle + Math.PI / 7),
        );
        ctx.closePath();
        ctx.fillStyle = isCycleEdge
          ? `rgba(255, 23, 68, ${alpha})`
          : `rgba(31, 31, 31, ${Math.max(alpha, 0.3)})`;
        ctx.fill();
      }
    },
    [hoverNode, showCycles, showSharedAttr],
  );

  /* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const stats = apiStats ?? { nodeCount: 0, edgeCount: 0, cycleCount: 0, communityCount: 0 };

  /* â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6 items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2979FF] animate-spin" />
          <span className="text-sm text-[#666666]">Loading graph intelligenceâ€¦</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         Graph Area
         â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="flex-1 relative bg-black">
        {mounted && filteredGraphData && (
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredGraphData}
            backgroundColor="#000000"
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              const r = 8;
              ctx.beginPath();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ctx.arc((node as any).x, (node as any).y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkCanvasObject={paintLink}
            onNodeClick={(node) => handleNodeClick(node as GraphNode)}
            onNodeHover={(node) => setHoverNode((node as GraphNode) || null)}
            onBackgroundClick={() => setSelectedNode(null)}
            cooldownTicks={120}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={60}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        )}

        {/* â”€â”€ Overlay Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="absolute top-4 left-4 bg-[rgba(20,20,20,0.9)] backdrop-blur-sm border border-[#1F1F1F] rounded-xl p-4 space-y-3 w-56">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium">
              Controls
            </p>
            <button
              onClick={loadData}
              className="p-1 text-[#666666] hover:text-[#EDEDED] transition-colors cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <Toggle label="Highlight Cycles" value={showCycles} onChange={setShowCycles} />
          <Toggle label="Fan Patterns" value={showFan} onChange={setShowFan} />
          <Toggle label="Shared Links" value={showSharedAttr} onChange={setShowSharedAttr} />
          <Toggle label="Show Labels" value={showLabels} onChange={setShowLabels} />

          <div className="flex gap-2">
            <button
              onClick={handleZoomToFit}
              className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs text-[#A0A0A0] hover:text-[#EDEDED] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              Fit
            </button>
            <button
              onClick={handleRunDemo}
              disabled={runningDemo}
              className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs font-semibold text-[#00C853] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[rgba(0,200,83,0.1)] transition-colors cursor-pointer disabled:opacity-50"
              title="Spawn 250 test transactions"
            >
              <Play className="w-3 h-3 fill-[#00C853]" />
              Run Demo
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRunGeoDemo}
              disabled={runningGeoDemo}
              className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs font-semibold text-[#2979FF] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[rgba(41,121,255,0.1)] transition-colors cursor-pointer disabled:opacity-50"
              title="Spawn Impossible Travel transactions (Mumbai -> London)"
            >
              <Globe className="w-3 h-3 text-[#2979FF]" />
              Run Geo Demo
            </button>
             <button
              onClick={handleResetDemo}
              disabled={resettingDemo}
              className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs font-semibold text-[#FF1744] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[rgba(255,23,68,0.1)] transition-colors cursor-pointer disabled:opacity-50"
              title="Clear all generated demo transactions and alerts"
            >
              <RefreshCcw className="w-3 h-3 text-[#FF1744]" />
              Reset Demo
            </button>
          </div>
          
          {isolatedCommunity !== null && (
            <div className="flex">
              <button
                onClick={() => handleIsolateCommunity(null)}
                className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs text-[#2979FF] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                Show All Communities
              </button>
            </div>
          )}

          <div className="h-px bg-[#1F1F1F]" />

          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium">
              Legend
            </p>
            <LegendDot color="#00C853" label="Low Risk (0-20)" />
            <LegendDot color="#FFB300" label="Medium (21-60)" />
            <LegendDot color="#FF1744" label="High (61-99)" />
            <LegendDot color="#FFFFFF" label="Blacklist (100)" />
            <div className="flex items-center gap-2">
              <span className="w-4 h-px border-t border-dashed border-[#00BCD4]" />
              <span className="text-[11px] text-[#A0A0A0]">Shared Device/IP</span>
            </div>
          </div>
        </div>

        {/* â”€â”€ Data source badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {error && (
          <div className="absolute top-4 right-4 bg-[rgba(255,183,0,0.1)] border border-[rgba(255,183,0,0.2)] rounded-lg px-3 py-1.5 text-xs text-[#FFB300]">
            {error}
          </div>
        )}

        {/* â”€â”€ Graph stat pills (bottom-left) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Pill label="Nodes" value={stats.nodeCount} />
          <Pill label="Edges" value={stats.edgeCount} />
          <Pill label="Cycles" value={stats.cycleCount} accent />
          <Pill label="Communities" value={stats.communityCount} />
          {isolatedCommunity !== null && (
            <Pill label="Isolated" value={isolatedCommunity} accent />
          )}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
         Detail Panel (right)
         â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <aside className="w-80 bg-[#141414] border-l border-[#1F1F1F] h-full overflow-y-auto shrink-0">
        {selectedNode ? (
          <NodeDetail
            node={selectedNode}
            links={selectedNeighbourLinks}
            cycleIds={cycleIds}
            cycles={cycles}
            communities={communities}
            onIsolateCommunity={handleIsolateCommunity}
            isolatedCommunity={isolatedCommunity}
          />
        ) : (
          <GraphSummary
            stats={stats}
            cycles={cycles}
            communities={communities}
            dataSource={dataSource}
            onIsolateCommunity={handleIsolateCommunity}
          />
        )}
      </aside>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Sub-components
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€â”€ Toggle Switch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-[#A0A0A0]">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative w-8 h-[18px] rounded-full transition-colors cursor-pointer',
          value ? 'bg-[#2979FF]' : 'bg-[#1F1F1F]',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform',
            value && 'translate-x-[14px]',
          )}
        />
      </button>
    </label>
  );
}

/* â”€â”€â”€ Legend Dot â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-[#A0A0A0]">{label}</span>
    </div>
  );
}

/* â”€â”€â”€ Stat Pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function Pill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-[rgba(20,20,20,0.9)] backdrop-blur-sm border border-[#1F1F1F] rounded-full px-3 py-1">
      <span className="text-[10px] text-[#666666] uppercase">{label}</span>
      <span
        className={cn(
          'font-mono text-xs font-semibold',
          accent ? 'text-[#FF1744]' : 'text-[#EDEDED]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* â”€â”€â”€ Graph Summary (no node selected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function GraphSummary({
  stats,
  cycles,
  communities,
  dataSource,
  onIsolateCommunity,
}: {
  stats: APIResponse['stats'];
  cycles: CycleInfo[];
  communities: string[][];
  dataSource: 'api' | 'fallback';
  onIsolateCommunity: (idx: number | null) => void;
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-[#EDEDED] mb-1">Money Map</h2>
        <p className="text-xs text-[#666666]">
          Click a node to inspect â€¢ Source: {dataSource === 'api' ? 'Live API' : 'Demo Data'}
        </p>
      </div>

      <div className="space-y-3">
        <StatRow label="Total Nodes" value={stats.nodeCount} />
        <StatRow label="Total Edges" value={stats.edgeCount} />
        <StatRow label="Cycles Detected" value={stats.cycleCount} color="#FF1744" />
        <StatRow label="Communities" value={stats.communityCount} />
      </div>

      <div className="h-px bg-[#1F1F1F]" />

      {/* Detected cycles */}
      {cycles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium">
            Detected Cycles
          </p>
          {cycles.slice(0, 3).map((c, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF1744]" />
                <span className="text-xs font-medium text-[#EDEDED]">
                  {c.nodes.length}-Node Cycle
                  {c.windowHours !== null && <span className="text-[#666666]"> â€¢ {c.windowHours}h window</span>}
                </span>
              </div>
              <p className="text-[11px] text-[#666666]">
                {c.nodes.join(' â†’ ')} â†’ {c.nodes[0]}
              </p>
              <p className="text-[11px] text-[#A0A0A0] mt-1">
                Total: {fmtAmount(c.totalAmount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Communities â€” with "Show Cluster" buttons */}
      {communities.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium">
            Communities
          </p>
          {communities.slice(0, 5).map((comm, idx) => (
            <button
              key={idx}
              onClick={() => onIsolateCommunity(idx)}
              className="flex items-center justify-between w-full p-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#2979FF] transition-colors cursor-pointer text-left"
            >
              <div>
                <span className="text-xs text-[#EDEDED] font-medium">Cluster {idx + 1}</span>
                <span className="text-[11px] text-[#666666] ml-2">{comm.length} nodes</span>
              </div>
              <Filter className="w-3 h-3 text-[#666666]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#A0A0A0]">{label}</span>
      <span
        className="font-mono text-sm font-semibold"
        style={{ color: color ?? '#EDEDED' }}
      >
        {value}
      </span>
    </div>
  );
}

/* â”€â”€â”€ Node Detail (node selected) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function NodeDetail({
  node,
  links,
  cycleIds,
  cycles,
  communities,
  onIsolateCommunity,
  isolatedCommunity,
}: {
  node: GraphNode;
  links: GraphLink[];
  cycleIds: Set<string>;
  cycles: CycleInfo[];
  communities: string[][];
  onIsolateCommunity: (idx: number | null) => void;
  isolatedCommunity: number | null;
}) {
  const inDegree = links.filter((l) => {
    const tgt = typeof l.target === 'string' ? l.target : l.target.id;
    return tgt === node.id;
  }).length;
  const outDegree = links.filter((l) => {
    const src = typeof l.source === 'string' ? l.source : l.source.id;
    return src === node.id;
  }).length;

  const inCycle = cycleIds.has(node.id);
  const cycleForNode = inCycle ? cycles.find(c => c.nodes.includes(node.id)) : null;

  // Shared attribute links
  const sharedLinks = links.filter(l => l.edgeType === 'SHARED_ATTRIBUTE');

  // Recent transactions (non-shared-attribute)
  const recentTxns = links
    .filter(l => l.edgeType !== 'SHARED_ATTRIBUTE')
    .slice(0, 5)
    .map((l, i) => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      const direction = src === node.id ? 'OUT' : 'IN';
      const other = direction === 'OUT' ? tgt : src;
      return { id: i, direction, other, amount: l.amount };
    });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium mb-1">
          Node Detail
        </p>
        <h2 className="text-lg font-semibold text-[#EDEDED] mb-2">{node.label}</h2>
        <p className="font-mono text-xs text-[#666666]">{node.id}</p>
      </div>

      {/* Risk Score */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">
            Risk Score
          </p>
          <span
            className="text-4xl font-bold font-mono"
            style={{ color: scoreColor(node.riskScore) }}
          >
            {node.riskScore}
          </span>
        </div>
        <SeverityBadge variant={scoreTier(node.riskScore)}>
          {node.tier}
        </SeverityBadge>
      </div>

      <div className="h-px bg-[#1F1F1F]" />

      {/* Degree + Community */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="In-Degree" value={node.inDegree} />
        <MiniStat label="Out-Degree" value={node.outDegree} />
        <MiniStat label="Community" value={node.communityId >= 0 ? `#${node.communityId}` : 'â€”'} />
        <MiniStat
          label="In Cycle"
          value={
            inCycle ? (
              <span className="text-[#FF1744] font-semibold">Yes</span>
            ) : (
              <span className="text-[#00C853]">No</span>
            )
          }
        />
      </div>

      {/* â”€â”€ Show Cluster / Show All Button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {node.communityId >= 0 && (
        <div>
          {isolatedCommunity === node.communityId ? (
            <button
              onClick={() => onIsolateCommunity(null)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#2979FF] bg-[#0A0A0A] border border-[rgba(41,121,255,0.3)] rounded-lg hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Show All Nodes
            </button>
          ) : (
            <button
              onClick={() => onIsolateCommunity(node.communityId)}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#EDEDED] bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg hover:bg-[#1F1F1F] hover:border-[#2979FF] transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Show Cluster Only
            </button>
          )}
        </div>
      )}

      {/* Cycle path */}
      {cycleForNode && (
        <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
          <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium mb-2">
            Cycle Path {cycleForNode.windowHours !== null && `(${cycleForNode.windowHours}h)`}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {[...cycleForNode.nodes, cycleForNode.nodes[0]].map((id, i, arr) => (
              <span key={i} className="contents">
                <span
                  className={cn(
                    'font-mono text-[11px] px-1.5 py-0.5 rounded',
                    id === node.id
                      ? 'bg-[rgba(255,23,68,0.15)] text-[#FF1744] border border-[rgba(255,23,68,0.2)]'
                      : 'bg-[#141414] text-[#A0A0A0] border border-[#1F1F1F]',
                  )}
                >
                  {id}
                </span>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-[#666666]" />
                )}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[#A0A0A0] mt-2">
            Total: {fmtAmount(cycleForNode.totalAmount)}
          </p>
        </div>
      )}

      {/* Shared attribute links */}
      {sharedLinks.length > 0 && (
        <>
          <div className="h-px bg-[#1F1F1F]" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium mb-3">
              Shared Attributes
            </p>
            <div className="space-y-2">
              {sharedLinks.map((l, i) => {
                const other = typeof l.source === 'string'
                  ? (l.source === node.id ? (typeof l.target === 'string' ? l.target : l.target.id) : l.source)
                  : (l.source.id === node.id ? (typeof l.target === 'string' ? l.target : l.target.id) : l.source.id);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#0A0A0A] border border-[rgba(0,188,212,0.15)]"
                  >
                    <Link2 className="w-3 h-3 text-[#00BCD4]" />
                    <span className="font-mono text-xs text-[#A0A0A0]">{other}</span>
                    <span className="text-[10px] text-[#00BCD4] ml-auto uppercase">
                      {l.sharedAttribute?.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-[#1F1F1F]" />

      {/* Recent Transactions */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium mb-3">
          Recent Transactions
        </p>
        <div className="space-y-2">
          {recentTxns.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded',
                    t.direction === 'OUT'
                      ? 'bg-[rgba(255,23,68,0.1)] text-[#FF1744]'
                      : 'bg-[rgba(0,200,83,0.1)] text-[#00C853]',
                  )}
                >
                  {t.direction}
                </span>
                <span className="font-mono text-xs text-[#A0A0A0]">
                  {t.other}
                </span>
              </div>
              <span className="font-mono text-xs text-[#EDEDED]">
                {fmtAmount(t.amount)}
              </span>
            </div>
          ))}
          {recentTxns.length === 0 && (
            <p className="text-xs text-[#666666]">No transaction edges</p>
          )}
        </div>
      </div>

      <div className="h-px bg-[#1F1F1F]" />

      {/* Links */}
      <div className="space-y-2">
        <a
          href="/dashboard/users"
          className="flex items-center gap-2 text-xs text-[#2979FF] hover:underline"
        >
          View Full Profile <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="/dashboard/alerts"
          className="flex items-center gap-2 text-xs text-[#2979FF] hover:underline"
        >
          Investigate in Alert Queue <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">
        {label}
      </p>
      <div className="text-sm font-mono text-[#EDEDED]">{value}</div>
    </div>
  );
}


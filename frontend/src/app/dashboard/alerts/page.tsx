'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase.client';
import { Search, Filter, ShieldAlert, ArrowUpDown, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { SeverityBadge } from '@/shared/components/ui/severity-badge';
import { AlertDetailPanel, type AlertRow } from '@/shared/components/dashboard/alert-detail-panel';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Fallback data â€” used when API is unavailable
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const FALLBACK_ALERTS: AlertRow[] = [
  { id: 'ALT-4001', priority: 1,  severity: 'critical', user: 'P*** M***', type: 'Structuring Detected',               source: 'ML',    riskScore: 92,  time: '2m ago',  status: 'PENDING',   assignedTo: 'Officer Patel' },
  { id: 'ALT-4002', priority: 2,  severity: 'critical', user: 'A*** O***', type: 'Sanctions Match (OFAC)',              source: 'RULE',  riskScore: 100, time: '5m ago',  status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4003', priority: 3,  severity: 'critical', user: 'R*** K***', type: 'CTR Threshold Exceeded',              source: 'RULE',  riskScore: 95,  time: '8m ago',  status: 'REVIEWING', assignedTo: 'Officer Khan' },
  { id: 'ALT-4004', priority: 4,  severity: 'high',     user: 'V*** S***', type: 'Cycle Detected (4 nodes)',             source: 'GRAPH', riskScore: 78,  time: '12m ago', status: 'REVIEWING', assignedTo: 'Officer Patel' },
  { id: 'ALT-4005', priority: 5,  severity: 'high',     user: 'S*** P***', type: 'Rapid Beneficiary Layering',           source: 'RULE',  riskScore: 74,  time: '18m ago', status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4006', priority: 6,  severity: 'high',     user: 'N*** R***', type: 'Dormant Account Surge',                source: 'ML',    riskScore: 70,  time: '25m ago', status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4007', priority: 7,  severity: 'high',     user: 'D*** J***', type: 'Cross-Border Velocity Trigger',        source: 'RULE',  riskScore: 68,  time: '32m ago', status: 'ESCALATED', assignedTo: 'Sr. Officer Sharma' },
  { id: 'ALT-4008', priority: 8,  severity: 'medium',   user: 'M*** A***', type: 'Isolation Forest Anomaly',             source: 'ML',    riskScore: 55,  time: '41m ago', status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4009', priority: 9,  severity: 'medium',   user: 'K*** B***', type: 'Geo-Velocity Mismatch',                source: 'RULE',  riskScore: 48,  time: '55m ago', status: 'REVIEWING', assignedTo: 'Officer Khan' },
  { id: 'ALT-4010', priority: 10, severity: 'medium',   user: 'L*** G***', type: 'Unusual Time-of-Day Transaction',      source: 'ML',    riskScore: 42,  time: '1h ago',  status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4011', priority: 11, severity: 'medium',   user: 'T*** N***', type: 'New Beneficiary High Amount',          source: 'RULE',  riskScore: 38,  time: '1.5h ago', status: 'RESOLVED', assignedTo: 'Officer Patel' },
  { id: 'ALT-4012', priority: 12, severity: 'medium',   user: 'H*** W***', type: 'Peer-Group Deviation',                 source: 'ML',    riskScore: 35,  time: '2h ago',  status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4013', priority: 13, severity: 'low',      user: 'J*** F***', type: 'KYC Document Expiring',                source: 'RULE',  riskScore: 18,  time: '3h ago',  status: 'PENDING',   assignedTo: null },
  { id: 'ALT-4014', priority: 14, severity: 'low',      user: 'B*** D***', type: 'Minor Address Mismatch',               source: 'RULE',  riskScore: 12,  time: '4h ago',  status: 'RESOLVED', assignedTo: 'Officer Khan' },
  { id: 'ALT-4015', priority: 15, severity: 'low',      user: 'C*** L***', type: 'Low-Confidence ML Flag',               source: 'ML',    riskScore: 8,   time: '5h ago',  status: 'RESOLVED', assignedTo: 'Officer Patel' },
];

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const API_BASE = '';

const sourcePill: Record<string, string> = {
  RULE:  'bg-[#141414] text-[#A0A0A0] border-[#1F1F1F]',
  ML:    'bg-[rgba(41,121,255,0.1)] text-[#2979FF] border-[rgba(41,121,255,0.2)]',
  GRAPH: 'bg-[rgba(168,85,247,0.1)] text-purple-400 border-[rgba(168,85,247,0.2)]',
};

const statusDot: Record<string, string> = {
  PENDING:   'bg-[#FFB300]',
  REVIEWING: 'bg-[#2979FF]',
  RESOLVED:  'bg-[#00C853]',
  ESCALATED: 'bg-[#FF1744]',
};

function scoreColor(s: number) {
  if (s > 60) return 'text-[#FF1744]';
  if (s >= 25) return 'text-[#FFB300]';
  return 'text-[#00C853]';
}

function mapApiAlert(a: any, idx: number): AlertRow {
  let parsedDetails: any = {};
  if (typeof a.details === 'string') {
    try { parsedDetails = JSON.parse(a.details); } catch {}
  } else if (typeof a.details === 'object' && a.details) {
    parsedDetails = a.details;
  }

  // Derive source from alert_type for better classification
  let source: AlertRow['source'] = 'RULE';
  const alertType = (a.alert_type ?? '').toUpperCase();
  if (alertType.includes('ML')) source = 'ML';
  else if (alertType.includes('HYBRID')) source = 'ML';
  else if (alertType.includes('GRAPH')) source = 'GRAPH';

  return {
    id: a.id ?? `ALT-${idx}`,
    priority: a.priority_rank ?? idx + 1,
    severity: (a.severity ?? 'medium').toLowerCase() as AlertRow['severity'],
    user: a.user_name ?? a.user_id ?? 'â€”',
    type: a.alert_type ?? a.summary ?? a.type ?? 'â€”',
    source,
    riskScore: a.risk_score ?? a.riskScore ?? 0,
    time: a.created_at ? new Date(a.created_at).toLocaleString() : 'â€”',
    status: (a.status ?? 'PENDING').toUpperCase(),
    assignedTo: a.assigned_to ?? null,
    aiExplanation: a.llm_explanation || parsedDetails.llm_explanation,
    ruleName: a.rule_name ?? parsedDetails.rule_triggered,
  };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Alert Queue Page
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function AlertQueuePage() {
  /* â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [alerts, setAlerts] = useState<AlertRow[]>(FALLBACK_ALERTS);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(FALLBACK_ALERTS.length);
  const perPage = 20;

  /* â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [severity, setSeverity] = useState('All');
  const [source, setSource]     = useState('All');
  const [status, setStatus]     = useState('All');
  const [search, setSearch]     = useState('');

  /* â”€â”€ Detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null);

  /* â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (severity !== 'All') params.set('severity', severity.toUpperCase());
      if (status !== 'All') params.set('status', status.toUpperCase());

      const res = await fetch(`${API_BASE}/api/alerts/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAlerts(data.data ? data.data.map(mapApiAlert) : []);
      setTotalCount(data.count ?? data.data?.length ?? 0);
      setDataSource('api');
    } catch {
      setAlerts(FALLBACK_ALERTS);
      setTotalCount(FALLBACK_ALERTS.length);
      setDataSource('fallback');
    }
    setLoading(false);
  }, [page, severity, status]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  /* â”€â”€ Client-side filtering (for search and source which aren't API params) â”€â”€ */
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (source !== 'All' && a.source !== source.toUpperCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.user.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, source, search]);

  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <>
      <div className="space-y-5">
        {/* â”€â”€ Source indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {dataSource === 'fallback' && !loading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,183,0,0.08)] border border-[rgba(255,183,0,0.15)] text-xs text-[#FFB300]">
            <AlertTriangle className="w-3 h-3" />
            API unavailable â€” showing demo data
            <button onClick={fetchAlerts} className="ml-auto p-1 hover:text-white transition-colors cursor-pointer">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* â”€â”€ Page Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#EDEDED]">Alert Queue</h1>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
          </span>
          <span className="text-xs text-[#A0A0A0]">{pendingCount} pending</span>
        </div>

        {/* â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={severity}
            onChange={setSeverity}
            options={['All', 'Critical', 'High', 'Medium', 'Low']}
            label="Severity"
          />
          <FilterSelect
            value={source}
            onChange={setSource}
            options={['All', 'Rule', 'ML', 'Graph']}
            label="Source"
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            options={['All', 'Pending', 'Reviewing', 'Resolved', 'Escalated']}
            label="Status"
          />
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search by user ID or ruleâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[#EDEDED] placeholder:text-[#666666] outline-none w-full"
            />
          </div>
        </div>

        {/* â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#141414]">
                {['#', 'Severity', 'User', 'Alert Type', 'Source', 'Risk', 'Time', 'Assigned To', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-[#666666]">
                    {alerts.length === 0
                      ? 'No alerts in queue â€” all clear.'
                      : 'No alerts match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className="border-b border-[#1F1F1F] hover:bg-[rgba(20,20,20,0.5)] transition-colors cursor-pointer"
                  >
                    {/* Priority */}
                    <td className="px-5 py-4 font-mono text-xs text-[#666666]">
                      {a.priority}
                    </td>
                    {/* Severity */}
                    <td className="px-5 py-4">
                      <SeverityBadge variant={a.severity} dot>
                        {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
                      </SeverityBadge>
                    </td>
                    {/* User */}
                    <td className="px-5 py-4 text-[#EDEDED]">
                      {a.user}
                    </td>
                    {/* Alert Type */}
                    <td className="px-5 py-4 text-[#A0A0A0] max-w-[250px] truncate">
                      {a.type}
                    </td>
                    {/* Source */}
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                          sourcePill[a.source],
                        )}
                      >
                        {a.source}
                      </span>
                    </td>
                    {/* Risk Score */}
                    <td className={cn('px-5 py-4 font-mono text-sm font-semibold', scoreColor(a.riskScore))}>
                      {a.riskScore}
                    </td>
                    {/* Time */}
                    <td className="px-5 py-4 text-xs text-[#666666] whitespace-nowrap">
                      {a.time}
                    </td>
                    {/* Assigned To */}
                    <td className="px-5 py-4 text-xs text-[#A0A0A0] whitespace-nowrap">
                      {a.assignedTo || (
                        <span className="text-[#555] italic">Unassigned</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#A0A0A0]">
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusDot[a.status])} />
                        {a.status}
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <button
                        className="text-xs text-[#2979FF] hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(a);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center justify-between text-xs text-[#666666] pt-2">
          <span>Showing {filtered.length} of {totalCount} alerts</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded bg-[#0A0A0A] border border-[#1F1F1F] disabled:opacity-30 hover:bg-[#141414] transition-colors cursor-pointer"
            >
              â† Prev
            </button>
            <span className="font-mono">Page {page} / {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded bg-[#0A0A0A] border border-[#1F1F1F] disabled:opacity-30 hover:bg-[#141414] transition-colors cursor-pointer"
            >
              Next â†’
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Detail Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AlertDetailPanel
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onResolve={() => {
          setSelectedAlert(null);
          fetchAlerts();
        }}
      />
    </>
  );
}

/* â”€â”€â”€ Filter Select Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#2E2E2E] cursor-pointer appearance-none pr-8"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {label}: {opt}
        </option>
      ))}
    </select>
  );
}


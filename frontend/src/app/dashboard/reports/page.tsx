'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Types & Constants
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type ReportType = 'STR' | 'CTR' | 'INTERNAL';
type ReportStatus = 'DRAFT' | 'PENDING_REVIEW' | 'FILED' | 'REJECTED';

interface Report {
  id: string;
  report_id: string;
  type: ReportType;
  status: ReportStatus;
  subject: string;
  user_name: string;
  user_id: string | null;
  amount: number;
  filed_by: string;
  content: string | null;
  alert_id: string | null;
  reg_ref: string | null;
  created_at: string;
  filed_at: string | null;
}

interface ReportsAPIResponse {
  reports: Report[];
  stats: {
    str_filed: number;
    ctr_filed: number;
    pending: number;
    total: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const typeStyle: Record<ReportType, { bg: string; text: string }> = {
  STR:      { bg: 'bg-[rgba(255,23,68,0.12)]',  text: 'text-[#FF1744]' },
  CTR:      { bg: 'bg-[rgba(255,179,0,0.12)]',  text: 'text-[#FFB300]' },
  INTERNAL: { bg: 'bg-[rgba(41,121,255,0.12)]', text: 'text-[#2979FF]' },
};

const statusConfig: Record<ReportStatus, { icon: React.ReactNode; color: string; label: string }> = {
  DRAFT:          { icon: <Clock className="w-3 h-3" />,          color: 'text-[#666666]', label: 'Draft' },
  PENDING_REVIEW: { icon: <AlertTriangle className="w-3 h-3" />, color: 'text-[#FFB300]', label: 'Pending Review' },
  FILED:          { icon: <CheckCircle2 className="w-3 h-3" />,  color: 'text-[#00C853]', label: 'Filed' },
  REJECTED:       { icon: <X className="w-3 h-3" />,             color: 'text-[#FF1744]', label: 'Rejected' },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   API helpers
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

async function fetchReports(): Promise<ReportsAPIResponse | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/reports`, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function createReport(data: {
  type: string;
  subject: string;
  user_name: string;
  amount: number;
  filed_by: string;
}): Promise<Report | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/reports/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Helpers
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function fmtAmount(n: number) {
  if (n >= 100000) return `â‚¹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 2)}L`;
  if (n >= 1000) return `â‚¹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `â‚¹${n.toLocaleString('en-IN')}`;
}

function fmtAmountFull(n: number) {
  return `â‚¹${n.toLocaleString('en-IN')}`;
}

function fmtDate(d: string | null) {
  if (!d) return 'â€”';
  try {
    const date = new Date(d);
    return date.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return d;
  }
}

function generatePreviewText(report: Report): string {
  if (report.content) return report.content;
  if (report.type === 'STR') {
    return `SUSPICIOUS TRANSACTION REPORT
Filed under: Prevention of Money Laundering Act 2002

Report ID: ${report.report_id}
Subject Account: ${report.user_name}
Filed By: ${report.filed_by}
Date Created: ${fmtDate(report.created_at)}
${report.filed_at ? `Date Filed: ${fmtDate(report.filed_at)}` : 'Status: PENDING FILING'}
${report.reg_ref ? `FIU Reference: ${report.reg_ref}` : ''}

NARRATIVE:
${report.subject}. Total amount involved: ${fmtAmountFull(report.amount)}.
Supporting transaction evidence is attached as Annexure A.

[DETERMINISTIC â€” No AI-generated text in this filing]`;
  }
  if (report.type === 'CTR') {
    return `CASH TRANSACTION REPORT
Mandatory filing under PMLA 2002, Rule 3

Report ID: ${report.report_id}
Account: ${report.user_name}
Total Cash Transactions: ${fmtAmountFull(report.amount)}
Threshold: â‚¹10,00,000
${report.reg_ref ? `FIU Reference: ${report.reg_ref}` : ''}

This CTR was auto-generated by the Sentinel compliance platform.
Mandatory reporting â€” no officer discretion required.`;
  }
  return `INTERNAL INVESTIGATION REPORT
Report ID: ${report.report_id}
Subject: ${report.user_name}
Investigator: ${report.filed_by}
Created: ${fmtDate(report.created_at)}

Summary: ${report.subject}
Amount under review: ${fmtAmountFull(report.amount)}

[INTERNAL USE ONLY â€” NOT FOR REGULATORY FILING]`;
}

function downloadReportText(report: Report) {
  const text = generatePreviewText(report);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.report_id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Page Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function ReportsPage() {
  /* â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ str_filed: 0, ctr_filed: 0, pending: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const resp = await fetchReports();
    if (resp) {
      setReports(resp.reports);
      setStats(resp.stats);
    } else {
      setError('Failed to load reports from API');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* â”€â”€ Filter & Search state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  /* â”€â”€ Modal state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [showNewReport, setShowNewReport] = useState(false);
  const [creating, setCreating] = useState(false);

  /* â”€â”€ New report form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [newType, setNewType] = useState<string>('STR');
  const [newSubject, setNewSubject] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFiledBy, setNewFiledBy] = useState('');

  /* â”€â”€ Filtered data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.report_id.toLowerCase().includes(q) ||
          (r.user_name || '').toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [typeFilter, statusFilter, search, reports]);

  /* â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleCreateReport = async () => {
    if (!newSubject.trim()) return;
    setCreating(true);
    const result = await createReport({
      type: newType,
      subject: newSubject,
      user_name: newUserName || 'Unknown',
      amount: parseFloat(newAmount) || 0,
      filed_by: newFiledBy || 'Officer',
    });
    setCreating(false);
    if (result) {
      setShowNewReport(false);
      setNewSubject('');
      setNewUserName('');
      setNewAmount('');
      setNewFiledBy('');
      setNewType('STR');
      loadData();
    }
  };

  /* â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2979FF] animate-spin" />
          <span className="text-sm text-[#666666]">Loading reportsâ€¦</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#EDEDED]">Reports</h1>
            <p className="text-xs text-[#666666] mt-1">
              STR/CTR filings & internal investigation reports
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] border border-[#1F1F1F] text-[#A0A0A0] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowNewReport(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(41,121,255,0.1)] border border-[rgba(41,121,255,0.2)] text-[#2979FF] hover:bg-[rgba(41,121,255,0.18)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>
        </div>

        {/* â”€â”€ Error Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(255,23,68,0.06)] border border-[rgba(255,23,68,0.15)]">
            <AlertTriangle className="w-4 h-4 text-[#FF1744] shrink-0" />
            <p className="text-xs text-[#FF1744]">{error}</p>
          </div>
        )}

        {/* â”€â”€ Summary Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-3 gap-4">
          <MiniCard label="STR Filed (2026)" value={stats.str_filed} color="#FF1744" />
          <MiniCard label="CTR Filed (2026)" value={stats.ctr_filed} color="#FFB300" />
          <MiniCard label="Pending / Draft" value={stats.pending} color="#2979FF" />
        </div>

        {/* â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-[#666666]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm text-[#EDEDED] outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="STR">STR</option>
              <option value="CTR">CTR</option>
              <option value="INTERNAL">Internal</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm text-[#EDEDED] outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="FILED">Filed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search reportsâ€¦"
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
                {['Report ID', 'Type', 'Status', 'Subject', 'User', 'Amount', 'Filed By', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#666666]">
                    {reports.length === 0 ? 'No reports yet. Click "+ New Report" to create one.' : 'No reports match the current filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const ts = typeStyle[r.type] || typeStyle.STR;
                  const ss = statusConfig[r.status] || statusConfig.DRAFT;
                  return (
                    <tr key={r.report_id} className="border-b border-[#1F1F1F] hover:bg-[#141414] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-[#A0A0A0]">{r.report_id}</td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', ts.bg, ts.text)} style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)', borderWidth: 1, borderStyle: 'solid' }}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs', ss.color)}>
                          {ss.icon} {ss.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#A0A0A0] max-w-[250px] truncate">{r.subject}</td>
                      <td className="px-5 py-4 font-mono text-xs text-[#EDEDED]">{r.user_name || 'â€”'}</td>
                      <td className="px-5 py-4 font-mono text-xs text-[#EDEDED]">{fmtAmountFull(r.amount)}</td>
                      <td className="px-5 py-4 text-sm text-[#A0A0A0]">{r.filed_by || 'â€”'}</td>
                      <td className="px-5 py-4 text-xs text-[#666666] whitespace-nowrap">{fmtDate(r.filed_at || r.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewReport(r)} className="p-1 rounded hover:bg-[#1F1F1F] transition-colors cursor-pointer" title="Preview">
                            <Eye className="w-3.5 h-3.5 text-[#2979FF]" />
                          </button>
                          <button onClick={() => downloadReportText(r)} className="p-1 rounded hover:bg-[#1F1F1F] transition-colors cursor-pointer" title="Download">
                            <Download className="w-3.5 h-3.5 text-[#666666]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* â”€â”€ Regulatory note â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(255,179,0,0.06)] border border-[rgba(255,179,0,0.15)]">
          <FileText className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5" />
          <p className="text-xs text-[#FFB300] leading-relaxed">
            All STR/CTR reports are generated using <span className="font-semibold">deterministic templates</span> â€” no AI-generated text is included in any regulatory filing (PMLA 2002 compliance).
          </p>
        </div>
      </div>

      {/* â”€â”€ Preview Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {previewReport && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPreviewReport(null)} />
          <div className="fixed inset-8 z-50 bg-[#141414] border border-[#1F1F1F] rounded-xl flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-[#A0A0A0]" />
                <span className="font-mono text-sm text-[#EDEDED]">{previewReport.report_id}</span>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', typeStyle[previewReport.type]?.bg, typeStyle[previewReport.type]?.text)} style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)', borderWidth: 1, borderStyle: 'solid' }}>
                  {previewReport.type}
                </span>
                <span className={cn('inline-flex items-center gap-1 text-xs', statusConfig[previewReport.status]?.color)}>
                  {statusConfig[previewReport.status]?.icon}
                  {statusConfig[previewReport.status]?.label}
                </span>
              </div>
              <button onClick={() => setPreviewReport(null)} className="p-1 rounded-md hover:bg-[#0A0A0A] transition-colors cursor-pointer">
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="font-mono text-sm text-[#A0A0A0] leading-relaxed whitespace-pre-wrap">
                {generatePreviewText(previewReport)}
              </pre>
            </div>
            <div className="px-6 py-4 border-t border-[#1F1F1F] flex justify-end gap-2">
              <button
                onClick={() => downloadReportText(previewReport)}
                className="px-4 py-2 rounded-lg text-sm bg-[#0A0A0A] border border-[#1F1F1F] text-[#A0A0A0] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 inline mr-2" />
                Export Text
              </button>
            </div>
          </div>
        </>
      )}

      {/* â”€â”€ New Report Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showNewReport && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => !creating && setShowNewReport(false)} />
          <div className="fixed inset-x-0 top-[10%] mx-auto z-50 w-full max-w-lg bg-[#141414] border border-[#1F1F1F] rounded-xl flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F]">
              <div className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-[#2979FF]" />
                <span className="text-sm font-semibold text-[#EDEDED]">New Report</span>
              </div>
              <button onClick={() => !creating && setShowNewReport(false)} className="p-1 rounded-md hover:bg-[#0A0A0A] transition-colors cursor-pointer">
                <X className="w-4 h-4 text-[#666666]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#666666] uppercase tracking-wider font-medium">Report Type</label>
                <div className="flex gap-2">
                  {(['STR', 'CTR', 'INTERNAL'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-colors cursor-pointer',
                        newType === t
                          ? `${typeStyle[t].bg} ${typeStyle[t].text} border-current`
                          : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#666666] hover:text-[#A0A0A0]',
                      )}
                    >
                      {t === 'INTERNAL' ? 'Internal' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#666666] uppercase tracking-wider font-medium">Subject *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Suspicious fund flow detectedâ€¦"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-sm text-[#EDEDED] placeholder:text-[#444] outline-none focus:border-[#2979FF] transition-colors"
                />
              </div>

              {/* User Name & Amount row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#666666] uppercase tracking-wider font-medium">User / Account</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. V*** S***"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-sm text-[#EDEDED] placeholder:text-[#444] outline-none focus:border-[#2979FF] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#666666] uppercase tracking-wider font-medium">Amount (â‚¹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-sm text-[#EDEDED] placeholder:text-[#444] outline-none focus:border-[#2979FF] transition-colors"
                  />
                </div>
              </div>

              {/* Filed By */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#666666] uppercase tracking-wider font-medium">Filed By</label>
                <input
                  type="text"
                  value={newFiledBy}
                  onChange={(e) => setNewFiledBy(e.target.value)}
                  placeholder="e.g. Officer Khan"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-sm text-[#EDEDED] placeholder:text-[#444] outline-none focus:border-[#2979FF] transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-[#1F1F1F] flex justify-end gap-2">
              <button
                onClick={() => !creating && setShowNewReport(false)}
                disabled={creating}
                className="px-4 py-2 rounded-lg text-sm bg-[#0A0A0A] border border-[#1F1F1F] text-[#A0A0A0] hover:bg-[#1F1F1F] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={creating || !newSubject.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(41,121,255,0.15)] border border-[rgba(41,121,255,0.3)] text-[#2979FF] hover:bg-[rgba(41,121,255,0.25)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creatingâ€¦
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create Report
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* â”€â”€â”€ Mini Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F]">
      <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-2">{label}</p>
      <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}


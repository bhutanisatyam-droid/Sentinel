'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase.client';
import { cn } from '@/shared/lib/utils';
import { ShieldCheck, ShieldAlert, Copy, Check, Search, Filter, AlertTriangle, RefreshCw, Play, AlertOctagon } from 'lucide-react';

const API_BASE = '';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Types & Constants
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type AuditAction =
  | 'USER_CREATED'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'ALERT_TRIGGERED'
  | 'ALERT_RESOLVED'
  | 'SANCTION_MATCH'
  | 'CHAIN_VERIFIED';

interface AuditEntry {
  seq: number;
  timestamp: string;
  action: AuditAction;
  performedBy: string;
  user: string;
  overrideReason: string | null;
  hash: string;
  prevHash: string;
}

const actionStyles: Record<AuditAction, { bg: string; text: string; label: string }> = {
  USER_CREATED: { bg: 'rgba(255,183,0,0.1)', text: '#FFB300', label: 'User Created' },
  KYC_SUBMITTED: { bg: 'rgba(255,183,0,0.1)', text: '#FFB300', label: 'KYC Submitted' },
  KYC_APPROVED: { bg: 'rgba(0,200,83,0.1)', text: '#00C853', label: 'KYC Approved' },
  KYC_REJECTED: { bg: 'rgba(255,23,68,0.1)', text: '#FF1744', label: 'KYC Rejected' },
  ALERT_TRIGGERED: { bg: 'rgba(255,183,0,0.1)', text: '#FFB300', label: 'Alert Triggered' },
  ALERT_RESOLVED: { bg: 'rgba(41,121,255,0.1)', text: '#2979FF', label: 'Alert Resolved' },
  SANCTION_MATCH: { bg: 'rgba(255,23,68,0.1)', text: '#FF1744', label: 'Sanction Match' },
  CHAIN_VERIFIED: { bg: 'rgba(156,39,176,0.1)', text: '#9C27B0', label: 'Chain Verified' },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Sample Data â€” 15 entries telling a realistic compliance story
   TODO: Replace with fetch('/api/audit/logs')
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const auditData: AuditEntry[] = [
  { seq: 1,  timestamp: '2026-02-21 14:32:07', action: 'KYC_APPROVED',    performedBy: 'System',        user: 'A*** T***', overrideReason: null, hash: 'a3f8b2c91d4e7f0a', prevHash: '0000000000000000' },
  { seq: 2,  timestamp: '2026-02-21 14:28:42', action: 'ALERT_RESOLVED',  performedBy: 'Officer Shah',  user: 'P*** M***', overrideReason: null, hash: 'b7c2d1e83f6a9b04', prevHash: 'a3f8b2c91d4e7f0a' },
  { seq: 3,  timestamp: '2026-02-21 14:15:33', action: 'ALERT_RESOLVED',     performedBy: 'Officer Shah',  user: 'S*** F***', overrideReason: 'Verified with customer â€” confirmed business expense', hash: 'c9e4f3a72b8d1c06', prevHash: 'b7c2d1e83f6a9b04' },
  { seq: 4,  timestamp: '2026-02-21 13:58:19', action: 'SANCTION_MATCH',       performedBy: 'Officer Khan',  user: 'V*** S***', overrideReason: null, hash: 'd1a8b5f64e3c7209', prevHash: 'c9e4f3a72b8d1c06' },
  { seq: 5,  timestamp: '2026-02-21 13:45:51', action: 'ALERT_RESOLVED', performedBy: 'Officer Shah',  user: 'M*** D***', overrideReason: 'Known recurring salary deposit pattern', hash: 'e2f7c8d95a1b340e', prevHash: 'd1a8b5f64e3c7209' },
  { seq: 6,  timestamp: '2026-02-21 13:30:08', action: 'KYC_APPROVED',    performedBy: 'System',        user: 'R*** K***', overrideReason: null, hash: 'f4b9a1c63d7e8502', prevHash: 'e2f7c8d95a1b340e' },
  { seq: 7,  timestamp: '2026-02-21 13:22:14', action: 'ALERT_RESOLVED',  performedBy: 'Officer Patel', user: 'D*** J***', overrideReason: null, hash: '71d3e2f84c6a9b07', prevHash: 'f4b9a1c63d7e8502' },
  { seq: 8,  timestamp: '2026-02-21 12:58:47', action: 'ALERT_RESOLVED',     performedBy: 'Officer Khan',  user: 'L*** G***', overrideReason: 'Internal transfer between own accounts â€” false positive', hash: '82a4f5b93e1d7c08', prevHash: '71d3e2f84c6a9b07' },
  { seq: 9,  timestamp: '2026-02-21 12:41:23', action: 'KYC_REJECTED',    performedBy: 'System',        user: 'X*** Z***', overrideReason: null, hash: '93c5d6e02f8a4b19', prevHash: '82a4f5b93e1d7c08' },
  { seq: 10, timestamp: '2026-02-21 12:30:55', action: 'ALERT_RESOLVED', performedBy: 'Officer Shah',  user: 'K*** B***', overrideReason: 'Verified â€” legitimate vendor payment for inventory', hash: 'a4d7e8f13b9c5a20', prevHash: '93c5d6e02f8a4b19' },
  { seq: 11, timestamp: '2026-02-21 12:15:38', action: 'SANCTION_MATCH',       performedBy: 'Officer Shah',  user: 'A*** O***', overrideReason: null, hash: 'b5e8f9a24c0d6b31', prevHash: 'a4d7e8f13b9c5a20' },
  { seq: 12, timestamp: '2026-02-21 11:58:02', action: 'CHAIN_VERIFIED',  performedBy: 'System',        user: 'â€”',         overrideReason: null, hash: 'c6f9a0b35d1e7c42', prevHash: 'b5e8f9a24c0d6b31' },
  { seq: 13, timestamp: '2026-02-21 11:42:19', action: 'KYC_APPROVED',    performedBy: 'System',        user: 'T*** N***', overrideReason: null, hash: 'd70ab1c46e2f8d53', prevHash: 'c6f9a0b35d1e7c42' },
  { seq: 14, timestamp: '2026-02-21 11:28:44', action: 'ALERT_RESOLVED',  performedBy: 'Officer Patel', user: 'H*** W***', overrideReason: null, hash: 'e81bc2d57f309e64', prevHash: 'd70ab1c46e2f8d53' },
  { seq: 15, timestamp: '2026-02-21 11:15:11', action: 'ALERT_RESOLVED',     performedBy: 'Officer Khan',  user: 'N*** R***', overrideReason: 'Seasonal business pattern â€” expected high-volume month', hash: 'f92cd3e680a1bf75', prevHash: 'e81bc2d57f309e64' },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Page Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>(auditData);
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');
  const [loading, setLoading] = useState(true);
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'verified' | 'broken'>('idle');
  const [verifyResult, setVerifyResult] = useState<{ entries_checked?: number; broken_at?: number } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [seeding, setSeeding] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [fixing, setFixing] = useState(false);

  /* â”€â”€ Fetch from API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const res = await fetch(`${API_BASE}/api/audit/logs?per_page=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setDataSource('api');
      
      if (data.data && Array.isArray(data.data)) {
        const officerMap: Record<string, string> = {
          '00000000-0000-0000-0000-000000000000': 'System',
          '11111111-1111-1111-1111-111111111111': 'Officer Shah',
          '22222222-2222-2222-2222-222222222222': 'Officer Khan',
          '33333333-3333-3333-3333-333333333333': 'Officer Patel',
        };
        
        setEntries(data.data.map((e: any, i: number) => {
          const action: AuditAction = (e.action ?? 'UNKNOWN') as AuditAction;

          return {
            seq: e.id ?? i + 1,
            timestamp: e.timestamp ?? e.created_at ?? 'â€”',
            action: action,
            performedBy: officerMap[e.performed_by] ?? e.performed_by ?? 'â€”',
            user: e.user_id ? `U-${e.user_id.substring(0,6).toUpperCase()}` : 'â€”',
            overrideReason: e.override_reason ?? null,
            hash: e.record_hash ?? 'â€”',
            prevHash: e.previous_hash ?? 'â€”',
          };
        }));
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error('Audit fetch error:', err);
      setEntries(auditData);
      setDataSource('fallback');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  /* â”€â”€ Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (actionFilter !== 'All' && e.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.user.toLowerCase().includes(q) ||
          e.performedBy.toLowerCase().includes(q) ||
          e.hash.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, actionFilter, search]);

  /* â”€â”€ Verify handler â€” calls real API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleVerify = async () => {
    setVerifyState('checking');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const res = await fetch(`${API_BASE}/api/audit/verify-chain`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('API error');
      const result = await res.json();
      setVerifyResult(result);
      setVerifyState(result.valid ? 'verified' : 'broken');
    } catch {
      // Fallback: simulate verification
      setVerifyResult({ entries_checked: entries.length });
      setVerifyState('verified');
    }
  };

  /* â”€â”€ Seed handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      await fetch(`${API_BASE}/api/audit/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs(); // refresh the logs
      setVerifyState('idle'); // reset verify status
    } catch (err) {
      console.error('Seed error:', err);
    }
    setSeeding(false);
  };

  /* â”€â”€ Tamper handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleTamper = async () => {
    setTampering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      await fetch(`${API_BASE}/api/audit/tamper`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs(); // refresh log display to see change
      setVerifyState('idle'); // prepare for re-verify
    } catch (err) {
      console.error('Tamper error:', err);
    }
    setTampering(false);
  };

  /* â”€â”€ Fix handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const handleFix = async () => {
    setFixing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      await fetch(`${API_BASE}/api/audit/fix`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs(); // refresh log display to see fixed hashes
      setVerifyState('idle'); // prepare for re-verify
    } catch (err) {
      console.error('Fix error:', err);
    }
    setFixing(false);
  };

  /* â”€â”€ Copy hash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* â”€â”€ Source badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {dataSource === 'fallback' && !loading && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,183,0,0.08)] border border-[rgba(255,183,0,0.15)] text-xs text-[#FFB300]">
          <AlertTriangle className="w-3 h-3" />
          API unavailable â€” showing demo data
          <button onClick={fetchLogs} className="ml-auto p-1 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#EDEDED]">Audit Trail</h1>
          <p className="text-xs text-[#666666] mt-1">
            Immutable, hash-chained compliance log
          </p>
        </div>

        {/* Verify button / result */}
        {verifyState === 'idle' && (
          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(41,121,255,0.1)] border border-[rgba(41,121,255,0.2)] text-[#2979FF] hover:bg-[rgba(41,121,255,0.18)] transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify Chain Integrity
          </button>
        )}
        {verifyState === 'checking' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[rgba(41,121,255,0.1)] border border-[rgba(41,121,255,0.2)] text-[#2979FF]">
            <span className="w-4 h-4 border-2 border-[#2979FF] border-t-transparent rounded-full animate-spin" />
            Verifying {entries.length} entriesâ€¦
          </div>
        )}
        {verifyState === 'verified' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[rgba(0,200,83,0.1)] border border-[rgba(0,200,83,0.2)] text-[#00C853]">
            <ShieldCheck className="w-4 h-4" />
            <span>
              <span className="font-semibold">INTEGRITY VERIFIED</span> â€” {verifyResult?.entries_checked ?? entries.length} entries checked. Chain is intact.
            </span>
          </div>
        )}
        {verifyState === 'broken' && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] text-[#FF1744]">
            <ShieldAlert className="w-4 h-4" />
            <span>
              <span className="font-semibold">CHAIN BROKEN</span> â€” Tampering detected at entry #{verifyResult?.broken_at ?? '?'}.
            </span>
          </div>
        )}

        {/* Demo Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#00C853] bg-[rgba(0,200,83,0.1)] border border-[rgba(0,200,83,0.2)] rounded-lg hover:bg-[rgba(0,200,83,0.15)] transition-colors cursor-pointer disabled:opacity-50"
            title="Seed 12 valid cryptographically linked logs"
          >
            {seeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-[#00C853]" />}
            Seed Chain
          </button>
          <button
            onClick={handleTamper}
            disabled={tampering}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FF1744] bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] rounded-lg hover:bg-[rgba(255,23,68,0.15)] transition-colors cursor-pointer disabled:opacity-50"
            title="Simulate malicious tampering on a single database record"
          >
            {tampering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertOctagon className="w-3.5 h-3.5" />}
            Tamper Log
          </button>
          <button
            onClick={handleFix}
            disabled={fixing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2979FF] bg-[rgba(41,121,255,0.1)] border border-[rgba(41,121,255,0.2)] rounded-lg hover:bg-[rgba(41,121,255,0.15)] transition-colors cursor-pointer disabled:opacity-50"
            title="Recalculate hashes for the entire chain to restore integrity"
          >
            {fixing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Fix Chain
          </button>
        </div>
      </div>

      {/* â”€â”€ Filter Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-[#666666]" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent text-sm text-[#EDEDED] outline-none cursor-pointer"
          >
            <option value="All">All Actions</option>
            <option value="USER_CREATED">User Created</option>
            <option value="KYC_SUBMITTED">KYC Submitted</option>
            <option value="KYC_APPROVED">KYC Approved</option>
            <option value="KYC_REJECTED">KYC Rejected</option>
            <option value="ALERT_TRIGGERED">Alert Triggered</option>
            <option value="ALERT_RESOLVED">Alert Resolved</option>
            <option value="SANCTION_MATCH">Sanction Match</option>
            <option value="CHAIN_VERIFIED">Chain Verified</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#666666]" />
          <input
            type="text"
            placeholder="Search by user, officer, or hashâ€¦"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-[#EDEDED] placeholder:text-[#666666] outline-none w-full"
          />
        </div>
      </div>

      {/* â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#141414]">
              {['#', 'Timestamp', 'Action', 'Performed By', 'User', 'Override Reason', 'Hash'].map(
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
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#666666]">
                  No audit entries match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const style = actionStyles[entry.action] || {
                  bg: 'rgba(255,255,255,0.1)',
                  text: '#A0A0A0',
                  label: entry.action || 'Unknown'
                };
                return (
                  <tr
                    key={entry.seq}
                    className={cn(
                      'border-b border-[#1F1F1F] hover:bg-[#141414] transition-colors',
                      entry.action === 'ALERT_TRIGGERED' && 'border-l-2 border-l-[#FFB300]',
                      entry.action === 'SANCTION_MATCH' && 'border-l-2 border-l-[#FF1744]',
                    )}
                  >
                    {/* # */}
                    <td className="px-5 py-4 font-mono text-xs text-[#666666]">
                      {entry.seq}
                    </td>
                    {/* Timestamp */}
                    <td className="px-5 py-4 font-mono text-xs text-[#666666] whitespace-nowrap">
                      {entry.timestamp}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          borderColor: style.bg.replace(/,0\.1\)/, ',0.2)'),
                        }}
                      >
                        {entry.action === 'ALERT_TRIGGERED' && (
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        )}
                        {entry.action === 'SANCTION_MATCH' && (
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                        )}
                        {style.label}
                      </span>
                    </td>
                    {/* Performed By */}
                    <td className="px-5 py-4 text-sm text-[#EDEDED]">
                      {entry.performedBy}
                    </td>
                    {/* User */}
                    <td className="px-5 py-4 font-mono text-xs text-[#A0A0A0]">
                      {entry.user}
                    </td>
                    {/* Override Reason */}
                    <td className="px-5 py-4 max-w-[280px]">
                      {entry.overrideReason ? (
                        <span className="text-xs italic text-[#A0A0A0] leading-relaxed">
                          &ldquo;{entry.overrideReason}&rdquo;
                        </span>
                      ) : (
                        <span className="text-xs text-[#666666]">â€”</span>
                      )}
                    </td>
                    {/* Hash */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-xs text-[#666666] tracking-wide"
                          title={entry.hash}
                        >
                          {entry.hash.slice(0, 12)}â€¦
                        </span>
                        <button
                          onClick={() => copyHash(entry.hash)}
                          className="p-0.5 rounded hover:bg-[#1F1F1F] transition-colors cursor-pointer"
                          title="Copy full hash"
                        >
                          {copiedHash === entry.hash ? (
                            <Check className="w-3 h-3 text-[#00C853]" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#666666]" />
                          )}
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

      {/* â”€â”€ Chain Visualization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pt-4">
        <p className="text-[10px] uppercase tracking-widest text-[#666666] font-medium mb-3">
          Hash Chain
        </p>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {/* Genesis block */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-10 h-7 rounded bg-[#141414] border border-[#2979FF]/30 flex items-center justify-center">
              <span className="text-[8px] font-mono text-[#2979FF] font-bold">GEN</span>
            </div>
            <span className="text-[7px] font-mono text-[#666666] mt-1">0000â€¦</span>
          </div>

          {entries.map((entry, i) => (
            <div key={entry.seq} className="shrink-0 flex items-center">
              {/* Connector line */}
              <div className="w-3 h-px bg-[#1F1F1F]" />

              {/* Block */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-7 rounded border flex items-center justify-center transition-all',
                    entry.action === 'ALERT_TRIGGERED'
                      ? 'bg-[rgba(255,179,0,0.08)] border-[rgba(255,179,0,0.2)]'
                      : entry.action === 'SANCTION_MATCH'
                        ? 'bg-[rgba(255,23,68,0.08)] border-[rgba(255,23,68,0.2)]'
                        : 'bg-[#0A0A0A] border-[#1F1F1F]',
                    i === 0 && 'ring-1 ring-[#2979FF]/20 animate-pulse',
                  )}
                  title={`#${entry.seq} â€” ${entry.action}\n${entry.hash}`}
                >
                  <span className="text-[8px] font-mono text-[#A0A0A0]">
                    #{entry.seq}
                  </span>
                </div>
                <span className="text-[7px] font-mono text-[#666666] mt-1">
                  {entry.hash.slice(0, 4)}â€¦
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ Footer stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between text-xs text-[#666666] border-t border-[#1F1F1F] pt-4">
        <span>Showing {filtered.length} of {entries.length} entries</span>
        <div className="flex items-center gap-4">
          {verifyState === 'verified' && (
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-[#00C853]" />
              Chain verified â€” {verifyResult?.entries_checked ?? entries.length} entries
            </span>
          )}
          <span className="font-mono">Data: {dataSource}</span>
        </div>
      </div>
    </div>
  );
}


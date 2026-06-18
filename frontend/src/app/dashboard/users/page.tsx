'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase.client';
import { SeverityBadge } from '@/shared/components/ui/severity-badge';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Types
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type KYCStatus = 'VERIFIED' | 'PENDING' | 'FAILED' | 'RE_KYC';
type RiskTier = 'GREEN' | 'YELLOW' | 'RED' | 'BLACKLIST';

interface UserProfile {
  id: string;
  name: string;
  tier: RiskTier;
  riskScore: number;
  kycStatus: KYCStatus;
  occupation: string;
  accountAge: string;
  lastTxn: string;
  txnCount30d: number;
  alertCount: number;
  faceMatchScore: number;
  location: string;
}

const kycBadge: Record<KYCStatus, { icon: React.ReactNode; color: string; label: string }> = {
  VERIFIED: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-[#00C853]', label: 'Verified' },
  PENDING:  { icon: <Clock className="w-3 h-3" />,        color: 'text-[#FFB300]', label: 'Pending' },
  FAILED:   { icon: <XCircle className="w-3 h-3" />,      color: 'text-[#FF1744]', label: 'Failed' },
  RE_KYC:   { icon: <ShieldAlert className="w-3 h-3" />,  color: 'text-[#2979FF]', label: 'Re-KYC Due' },
};

function tierVariant(t: RiskTier): 'critical' | 'high' | 'medium' | 'low' {
  switch (t) {
    case 'BLACKLIST': return 'critical';
    case 'RED':       return 'high';
    case 'YELLOW':    return 'medium';
    default:          return 'low';
  }
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-[#FF1744]';
  if (s > 40)  return 'text-[#FFB300]';
  return 'text-[#00C853]';
}

const FALLBACK_USER_DATA: UserProfile[] = [];

const API_BASE = '';

function mapApiUser(u: any): UserProfile {
  return {
    id: u.id,
    name: u.full_name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Unknown Name'),
    tier: (u.kyc_risk_tier ?? 'GREEN').toUpperCase() as RiskTier,
    riskScore: u.risk_score ?? 0,
    kycStatus: (u.kyc_status ?? 'PENDING').toUpperCase() as KYCStatus,
    occupation: u.occupation ?? 'Unknown',
    accountAge: u.created_at ? `${Math.floor((new Date().getTime() - new Date(u.created_at).getTime())/(1000*3600*24))} days` : 'â€”',
    lastTxn: u.last_transaction_date ? new Date(u.last_transaction_date).toLocaleString() : 'Never',
    txnCount30d: u.total_transactions ?? 0,
    alertCount: u.active_alerts ?? 0,
    faceMatchScore: u.face_match_score != null ? Number(u.face_match_score.toFixed(1)) : 0,
    location: (u.kyc_latitude != null && u.kyc_longitude != null) 
      ? `${Number(u.kyc_latitude).toFixed(4)}, ${Number(u.kyc_longitude).toFixed(4)}` 
      : 'Unknown',
  };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Page Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function UsersPage() {
  const [tierFilter, setTierFilter] = useState('All');
  const [kycFilter, setKycFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'riskScore' | 'txnCount30d' | 'alertCount'>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [userData, setUserData] = useState<UserProfile[]>(FALLBACK_USER_DATA);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';
        const params = new URLSearchParams();
        if (tierFilter !== 'All') params.set('risk_tier', tierFilter);
        if (search) params.set('search', search);

        const res = await fetch(`${API_BASE}/api/users/?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data.data?.map(mapApiUser) || []);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
      setLoading(false);
    }
    loadUsers();
  }, [tierFilter, search]);

  const filtered = useMemo(() => {
    let data = userData.filter((u) => {
      if (tierFilter !== 'All' && u.tier !== tierFilter) return false;
      if (kycFilter !== 'All' && u.kycStatus !== kycFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.occupation.toLowerCase().includes(q)
        );
      }
      return true;
    });
    data = [...data].sort((a, b) => {
      const diff = a[sortBy] - b[sortBy];
      return sortDir === 'desc' ? -diff : diff;
    });
    return data;
  }, [tierFilter, kycFilter, search, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  /* Stats */
  const totalUsers = userData.length;
  const redUsers = userData.filter((u) => u.tier === 'RED' || u.tier === 'BLACKLIST').length;
  const kycPending = userData.filter((u) => u.kycStatus === 'PENDING' || u.kycStatus === 'RE_KYC').length;

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />;
  };

  return (
    <div className="space-y-6">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <h1 className="text-lg font-semibold text-[#EDEDED]">Users</h1>
        <p className="text-xs text-[#666666] mt-1">
          KYC verified identities and risk profile management
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#3b82f6] px-3 py-2 bg-[rgba(59,130,246,0.1)] rounded-lg border border-[rgba(59,130,246,0.2)]">
          <Clock className="w-4 h-4 animate-spin" />
          Loading users from Supabase...
        </div>
      )}

      {/* â”€â”€ Stats Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-4 gap-4">
        <MiniStat label="Total Users" value={totalUsers} />
        <MiniStat label="High Risk" value={redUsers} color="#FF1744" />
        <MiniStat label="KYC Pending" value={kycPending} color="#FFB300" />
        <MiniStat label="Alerts Active" value={userData.reduce((s, u) => s + u.alertCount, 0)} color="#2979FF" />
      </div>

      {/* â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-[#666666]" />
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="bg-transparent text-sm text-[#EDEDED] outline-none cursor-pointer">
            <option value="All">All Tiers</option>
            <option value="GREEN">Green</option>
            <option value="YELLOW">Yellow</option>
            <option value="RED">Red</option>
            <option value="BLACKLIST">Blacklist</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2">
          <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="bg-transparent text-sm text-[#EDEDED] outline-none cursor-pointer">
            <option value="All">All KYC</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="RE_KYC">Re-KYC Due</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#666666]" />
          <input type="text" placeholder="Search usersâ€¦" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm text-[#EDEDED] placeholder:text-[#666666] outline-none w-full" />
        </div>
      </div>

      {/* â”€â”€ Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#141414]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]">User</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]">Tier</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666] cursor-pointer select-none" onClick={() => toggleSort('riskScore')}>
                Risk Score <SortIcon col="riskScore" />
              </th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]">KYC</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]">Occupation</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666] cursor-pointer select-none" onClick={() => toggleSort('txnCount30d')}>
                Txns (30d) <SortIcon col="txnCount30d" />
              </th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666] cursor-pointer select-none" onClick={() => toggleSort('alertCount')}>
                Alerts <SortIcon col="alertCount" />
              </th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]">Last Txn</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider font-medium text-[#666666]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const kyc = kycBadge[u.kycStatus];
              const expanded = expandedUserId === u.id;
              return (
                <React.Fragment key={u.id}>
                  <tr
                    onClick={() => setExpandedUserId(expanded ? null : u.id)}
                    className={cn(
                      'border-b border-[#1F1F1F] hover:bg-[#141414] transition-colors cursor-pointer',
                      u.tier === 'BLACKLIST' && 'border-l-2 border-l-[#FF1744]',
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center text-xs font-bold text-[#A0A0A0]">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-[#EDEDED]">{u.name}</p>
                          <p className="font-mono text-[10px] text-[#666666]">{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <SeverityBadge variant={tierVariant(u.tier)}>{u.tier}</SeverityBadge>
                    </td>
                    <td className={cn('px-5 py-4 font-mono text-sm font-semibold', scoreColor(u.riskScore))}>
                      {u.riskScore}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1 text-xs', kyc.color)}>
                        {kyc.icon} {kyc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#A0A0A0]">{u.occupation}</td>
                    <td className="px-5 py-4 font-mono text-xs text-[#EDEDED]">{u.txnCount30d}</td>
                    <td className="px-5 py-4">
                      {u.alertCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-[rgba(255,23,68,0.1)] text-[#FF1744] border border-[rgba(255,23,68,0.2)]">
                          {u.alertCount}
                        </span>
                      ) : (
                        <span className="text-xs text-[#666666]">â€”</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#666666] whitespace-nowrap">{u.lastTxn}</td>
                    <td className="px-5 py-4">
                      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#666666]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-[#0A0A0A]">
                      <td colSpan={9} className="px-8 py-5">
                        <div className="grid grid-cols-4 gap-6">
                          <DetailField label="Account Age" value={u.accountAge} />
                          <DetailField label="Location" value={u.location} />
                          <DetailField
                            label="Face Match"
                            value={
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                                  <div className="h-full rounded-full bg-[#00C853]" style={{ width: `${u.faceMatchScore}%` }} />
                                </div>
                                <span className="font-mono text-xs text-[#EDEDED]">{u.faceMatchScore}%</span>
                              </div>
                            }
                          />
                          <DetailField
                            label="Actions"
                            value={
                              <div className="flex gap-2">
                                <a href="/dashboard/alerts" className="text-xs text-[#2979FF] hover:underline inline-flex items-center gap-1">
                                  Alerts <ExternalLink className="w-3 h-3" />
                                </a>
                                <a href="/dashboard/money-map" className="text-xs text-[#2979FF] hover:underline inline-flex items-center gap-1">
                                  Graph <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-center justify-between text-xs text-[#666666]">
        <span>Showing {filtered.length} of {userData.length} users</span>
        <span className="font-mono">Page 1 / 1</span>
      </div>
    </div>
  );
}

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F]">
      <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-2">{label}</p>
      <span className="text-2xl font-bold font-mono" style={{ color: color ?? '#EDEDED' }}>{value}</span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-1">{label}</p>
      <div className="text-sm text-[#EDEDED]">{value}</div>
    </div>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Shield,
  UserCheck,
  TrendingDown,
  Clock,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '@/shared/components/ui/stat-card';
import { SeverityBadge } from '@/shared/components/ui/severity-badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { DashboardMetrics } from '@/modules/aml/types/aml.types';

export interface RecentAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  user: string;
  type: string;
  source: string;
  time: string;
  status: string;
}

interface DashboardClientViewProps {
  initialMetrics: DashboardMetrics | null;
  initialAlerts: RecentAlert[];
}

const FALLBACK_METRICS: DashboardMetrics = {
  risk_distribution: [
    { tier: 'LOW', count: 847 },
    { tier: 'MEDIUM', count: 156 },
    { tier: 'HIGH', count: 43 },
    { tier: 'BLACKLIST', count: 4 },
  ],
  alert_velocity: {
    total_24h: 47,
    avg_per_hour: 1.96,
    hourly: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      alerts: Math.floor(Math.sin(i / 3.8) * 6 + 8 + Math.random() * 4),
    })),
  },
  false_positive_rate: 12.3,
  total_resolved: 234,
  mttr_hours: 4.2,
  top_triggered_rules: [
    { rule: 'Structuring', count: 28 },
    { rule: 'Geo-Velocity', count: 15 },
    { rule: 'Dormant Wake-Up', count: 11 },
    { rule: 'Profile Mismatch', count: 8 },
    { rule: 'Fan-In/Fan-Out', count: 6 },
  ],
  active_alerts: 47,
  pending_kyc_reviews: 8,
};

const statusDot: Record<string, string> = {
  PENDING:   'bg-[#f59e0b]',
  REVIEWING: 'bg-[#3b82f6]',
  RESOLVED:  'bg-[#10b981]',
  ESCALATED: 'bg-[#ef4444]',
};

const TIER_COLORS: Record<string, string> = {
  LOW:       '#10b981',
  MEDIUM:    '#f59e0b',
  HIGH:      '#ef4444',
  BLACKLIST: '#555',
};

export default function DashboardClientView({ initialMetrics, initialAlerts }: DashboardClientViewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics || FALLBACK_METRICS);
  const [source, setSource] = useState<'api' | 'fallback'>(initialMetrics ? 'api' : 'fallback');
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>(initialAlerts);

  // Re-sync if server props somehow change (e.g., router.refresh())
  useEffect(() => {
    if (initialMetrics) {
      setMetrics(initialMetrics);
      setSource('api');
    } else {
      setMetrics(FALLBACK_METRICS);
      setSource('fallback');
    }
    setRecentAlerts(initialAlerts);
  }, [initialMetrics, initialAlerts]);

  const load = useCallback(async () => {
    window.location.reload();
  }, []);

  const riskDistPie = metrics.risk_distribution.map(r => ({
    name: r.tier,
    value: r.count,
    color: TIER_COLORS[r.tier] ?? '#555',
  }));

  const totalUsers = riskDistPie.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-5">
      {/* Source badge */}
      {source === 'fallback' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,183,0,0.08)] border border-[rgba(255,183,0,0.15)] text-xs text-[#FFB300]">
          <AlertTriangle className="w-3 h-3" />
          API unavailable — showing demo data
          <button onClick={load} className="ml-auto p-1 hover:text-white transition-colors cursor-pointer">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard
          label="Active Alerts"
          value={metrics.active_alerts}
          icon={AlertTriangle}
          change={`${metrics.alert_velocity.total_24h} in 24h`}
          changeType="negative"
        />
        <StatCard
          label="False Positive Rate"
          value={`${metrics.false_positive_rate}%`}
          icon={TrendingDown}
          change={`${metrics.total_resolved} resolved`}
          changeType={metrics.false_positive_rate < 15 ? 'positive' : 'negative'}
        />
        <StatCard
          label="MTTR"
          value={metrics.mttr_hours !== null ? `${metrics.mttr_hours}h` : '—'}
          icon={Clock}
        />
        <StatCard
          label="KYC Pending"
          value={metrics.pending_kyc_reviews}
          icon={UserCheck}
        />
        <StatCard
          label="Avg Risk"
          value={totalUsers > 0 ? Math.round((riskDistPie[2]?.value ?? 0) / totalUsers * 100) + '%' : '—'}
          icon={Shield}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-12 gap-3">
        {/* Alert velocity */}
        <div className="col-span-12 xl:col-span-8 bg-[#0A0A0A] border border-[#161616] rounded-lg p-5">
          <span className="text-[11px] text-[#555] uppercase tracking-[0.08em]">
            Alert Velocity — Last 24h
          </span>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={metrics.alert_velocity.hourly}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#161616" vertical={false} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} interval={3} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} width={24} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#999', fontSize: '11px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="alerts" stroke="#3b82f6" strokeWidth={1.5} fill="url(#areaFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk distribution */}
        <div className="col-span-12 xl:col-span-4 bg-[#0A0A0A] border border-[#161616] rounded-lg p-5">
          <span className="text-[11px] text-[#555] uppercase tracking-[0.08em]">
            Risk Distribution
          </span>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskDistPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value" stroke="none">
                  {riskDistPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#999', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {riskDistPie.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] text-[#555]">{entry.name}</span>
                <span className="text-[10px] font-mono text-[#888]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Triggered Rules + MTTR Detail */}
      <div className="grid grid-cols-12 gap-3">
        {/* Top Triggered Rules */}
        <div className="col-span-12 xl:col-span-6 bg-[#0A0A0A] border border-[#161616] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] text-[#555] uppercase tracking-[0.08em]">
              Top Triggered Rules
            </span>
            <BarChart3 className="w-4 h-4 text-[#333]" />
          </div>
          {metrics.top_triggered_rules.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={metrics.top_triggered_rules} layout="vertical">
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                <YAxis type="category" dataKey="rule" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', color: '#999', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-[#555]">No rule data available</p>
          )}
        </div>

        {/* MTTR + Operational Metrics */}
        <div className="col-span-12 xl:col-span-6 bg-[#0A0A0A] border border-[#161616] rounded-lg p-5">
          <span className="text-[11px] text-[#555] uppercase tracking-[0.08em]">
            Operational Metrics
          </span>
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="p-4 rounded-lg bg-black border border-[#161616]">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Mean Time to Resolution</p>
              <p className="text-3xl font-mono font-semibold text-[#EDEDED]">
                {metrics.mttr_hours !== null ? `${metrics.mttr_hours}h` : '—'}
              </p>
              <p className="text-[10px] text-[#555] mt-1">AVG(resolved_at − created_at)</p>
            </div>
            <div className="p-4 rounded-lg bg-black border border-[#161616]">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">False Positive Rate</p>
              <p className="text-3xl font-mono font-semibold text-[#EDEDED]">
                {metrics.false_positive_rate}%
              </p>
              <p className="text-[10px] text-[#555] mt-1">{metrics.total_resolved} total resolved</p>
            </div>
            <div className="p-4 rounded-lg bg-black border border-[#161616]">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Alert Velocity</p>
              <p className="text-3xl font-mono font-semibold text-[#EDEDED]">
                {metrics.alert_velocity.avg_per_hour}/h
              </p>
              <p className="text-[10px] text-[#555] mt-1">{metrics.alert_velocity.total_24h} in 24h</p>
            </div>
            <div className="p-4 rounded-lg bg-black border border-[#161616]">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">KYC Pending Review</p>
              <p className="text-3xl font-mono font-semibold text-[#EDEDED]">
                {metrics.pending_kyc_reviews}
              </p>
              <p className="text-[10px] text-[#555] mt-1">Awaiting officer action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Alerts */}
      <div className="bg-[#0A0A0A] border border-[#161616] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#161616]">
          <span className="text-[11px] text-[#555] uppercase tracking-[0.08em]">Recent Alerts</span>
          <a href="/dashboard/alerts" className="text-[11px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
            View all →
          </a>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#161616]">
              {['Severity', 'User', 'Type', 'Source', 'Time', 'Status'].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-[9px] uppercase tracking-[0.1em] font-medium text-[#444]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#555]">
                  No recent alerts — all clear.
                </td>
              </tr>
            ) : (
              recentAlerts.map((a) => (
                <tr key={a.id} className="border-b border-[#111] last:border-b-0 hover:bg-[#111] transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <SeverityBadge variant={a.severity} dot>
                      {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
                    </SeverityBadge>
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#999]">{a.user}</td>
                  <td className="px-5 py-3 text-[#666]">{a.type}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-mono text-[#555]">{a.source}</span>
                  </td>
                  <td className="px-5 py-3 text-[#444]">{a.time}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#666]">
                      <span className={`w-1 h-1 rounded-full ${statusDot[a.status] || 'bg-[#555]'}`} />
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

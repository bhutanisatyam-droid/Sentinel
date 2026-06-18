'use client';

import { useState } from 'react';
import { X, CheckCircle2, Clock, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase.client';
import { cn } from '@/shared/lib/utils';
import { SeverityBadge } from '@/shared/components/ui/severity-badge';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Types
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export interface AlertRow {
  id: string;
  priority: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  user: string;
  type: string;
  source: 'RULE' | 'ML' | 'GRAPH';
  riskScore: number;
  time: string;
  status: string;
  assignedTo?: string | null;
  aiExplanation?: string;
  ruleName?: string;
}

interface Props {
  alert: AlertRow | null;
  onClose: () => void;
  onResolve?: () => void;
}

/* â”€â”€â”€ Sample detail data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
// TODO: Wire to fetch('/api/alerts/{alert_id}')

const sampleProfile = {
  kycStatus: 'Verified',
  accountAge: '2y 4m',
  riskTier: 'high' as const,
  occupation: 'Import/Export',
  faceMatchScore: 94,
};

const sampleRuleEvidence = [
  {
    ruleId: 'R-101',
    name: 'CTR Structuring',
    explanation:
      'Multiple deposits of â‚¹9,500 within 24h â€” individually below â‚¹10,000 CTR threshold but aggregated total â‚¹47,500 suggests intentional structuring.',
    data: 'TXNs: 5 Ã— avg â‚¹9,500 | 24h window | Total: â‚¹47,500',
  },
  {
    ruleId: 'R-205',
    name: 'Rapid Beneficiary Cycling',
    explanation:
      'Funds sent to 4 unique beneficiaries within 2 hours, each receiving near-identical amounts â€” pattern consistent with layering.',
    data: '4 beneficiaries | â‚¹9,400â€“â‚¹9,600 range | 2h window',
  },
];

const sampleShapFeatures = [
  { feature: 'txn_amount_zscore', value: 3.2, contribution: 0.38 },
  { feature: 'beneficiary_count_24h', value: 4, contribution: 0.27 },
  { feature: 'time_since_last_txn', value: 12, contribution: 0.18 },
];

const sampleCyclePath = ['P*** M***', 'Shell Corp A', 'V*** S***', 'Shell Corp B', 'P*** M***'];

const txnHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  amount: Math.floor(Math.random() * 30000) + 5000 + (i === 27 ? 45000 : 0),
}));

const OVERRIDE_REASONS = [
  'Legitimate business',
  'Known pattern',
  'Verified with customer',
  'Other',
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Panel Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AlertDetailPanel({ alert, onClose, onResolve }: Props) {
  const [dismissing, setDismissing] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideText, setOverrideText] = useState('');

  if (!alert) return null;

  const canDismiss =
    overrideReason !== '' &&
    (overrideReason !== 'Other' || overrideText.length >= 20);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-[520px] z-50',
          'bg-[#141414] border-l border-[#1F1F1F]',
          'flex flex-col',
          'animate-slide-in-right',
        )}
      >
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="px-6 py-5 border-b border-[#1F1F1F] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-[#666666]">
              Case #{alert.id}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[#0A0A0A] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#666666]" />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <SeverityBadge variant={alert.severity} dot>
              {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
            </SeverityBadge>
            <StatusBadge status={alert.status} />
          </div>
          <h2 className="text-xl font-semibold text-[#EDEDED]">{alert.type}</h2>
        </div>

        {/* â”€â”€ Scrollable Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* User Profile */}
          <Section title="User Profile">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="User" value={alert.user} mono />
              <Field
                label="KYC Status"
                value={
                  <span className="inline-flex items-center gap-1 text-[#00C853]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {sampleProfile.kycStatus}
                  </span>
                }
              />
              <Field label="Account Age" value={sampleProfile.accountAge} />
              <Field
                label="Risk Tier"
                value={
                  <SeverityBadge variant={sampleProfile.riskTier}>
                    {sampleProfile.riskTier.toUpperCase()}
                  </SeverityBadge>
                }
              />
              <Field label="Occupation" value={sampleProfile.occupation} />
              <Field
                label="Face Match"
                value={
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#00C853]"
                        style={{ width: `${sampleProfile.faceMatchScore}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[#EDEDED]">
                      {sampleProfile.faceMatchScore}%
                    </span>
                  </div>
                }
              />
            </div>
          </Section>

          {/* Evidence */}
          <Section
            title="Evidence"
            badge={
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A0A0A] text-[#666666] border border-[#1F1F1F]">
                Deterministic
              </span>
            }
          >
            <div className="space-y-3">
              {alert.aiExplanation ? (
                <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#141414] text-[#A0A0A0] border border-[#1F1F1F]">
                      AUTOMATED
                    </span>
                    <span className="text-sm font-medium text-[#EDEDED]">
                      {alert.ruleName || "LLM Risk Analysis"}
                    </span>
                  </div>
                  <p className="text-xs text-[#A0A0A0] leading-relaxed mb-2 whitespace-pre-wrap">
                    {alert.aiExplanation}
                  </p>
                </div>
              ) : (
                sampleRuleEvidence.map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#141414] text-[#A0A0A0] border border-[#1F1F1F]">
                        {rule.ruleId}
                      </span>
                      <span className="text-sm font-medium text-[#EDEDED]">
                        {rule.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed mb-2">
                      {rule.explanation}
                    </p>
                    <div className="font-mono text-xs bg-[#141414] px-3 py-1.5 rounded-md border border-[#1F1F1F] text-[#EDEDED]">
                      {rule.data}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          {/* ML Section */}
          {(alert.source === 'ML' || alert.riskScore > 70) && (
            <Section
              title="ML Anomaly Score"
              badge={
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(41,121,255,0.1)] text-[#2979FF] border border-[rgba(41,121,255,0.2)]">
                  AI-Assisted
                </span>
              }
            >
              <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#A0A0A0]">Isolation Forest Score</span>
                  <span className="font-mono text-sm font-semibold text-[#FF1744]">
                    {alert.riskScore}
                  </span>
                </div>

                <p className="text-[10px] uppercase tracking-wider text-[#666666] font-medium">
                  Top SHAP features
                </p>
                <div className="space-y-2">
                  {sampleShapFeatures.map((f) => (
                    <div key={f.feature} className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#A0A0A0] w-40 truncate">
                        {f.feature}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#1F1F1F] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2979FF]"
                          style={{ width: `${f.contribution * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[#EDEDED] w-8 text-right">
                        {(f.contribution * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-[rgba(255,179,0,0.06)] border border-[rgba(255,179,0,0.15)]">
                <Info className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5" />
                <p className="text-xs text-[#FFB300] leading-relaxed">
                  <span className="font-bold">AI-ASSISTED PRIORITIZATION</span> â€” This score is
                  generated by a machine learning model and is intended for triage only.
                  It must <span className="font-semibold">not</span> be cited in any regulatory
                  filing or STR submission.
                </p>
              </div>
            </Section>
          )}

          {/* Graph Section */}
          {(alert.source === 'GRAPH' || alert.type.toLowerCase().includes('cycle')) && (
            <Section
              title="Graph Analysis"
              badge={
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(168,85,247,0.1)] text-purple-400 border border-[rgba(168,85,247,0.2)]">
                  Network
                </span>
              }
            >
              <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
                <p className="text-[10px] uppercase tracking-wider text-[#666666] font-medium mb-3">
                  Cycle Path ({sampleCyclePath.length - 1} nodes)
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {sampleCyclePath.map((node, i) => (
                    <span key={i} className="contents">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-[#141414] text-[#EDEDED] border border-[#1F1F1F]">
                        {node}
                      </span>
                      {i < sampleCyclePath.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-[#666666]" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </Section>
          )}

          {/* Transaction History */}
          <Section title="Transaction History (30d)">
            <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={txnHistory}>
                  <defs>
                    <linearGradient id="txnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2979FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2979FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2979FF"
                    strokeWidth={1.5}
                    fill="url(#txnGrad)"
                  />
                  <ReferenceLine x={27} stroke="#FF1744" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-[#A0A0A0]">
                  Current: <span className="font-mono text-[#EDEDED]">â‚¹47,500</span>
                </span>
                <span className="text-[#A0A0A0]">
                  Z-score: <span className="font-mono text-[#FF1744]">3.2Ïƒ</span>
                </span>
              </div>
            </div>
            <a
              href="/dashboard/money-map"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)] text-xs text-purple-400 hover:bg-[rgba(168,85,247,0.15)] transition-colors"
            >
              ðŸ—ºï¸ View in Money Map
            </a>
          </Section>
        </div>

        {/* â”€â”€ Actions (sticky bottom) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="shrink-0 px-6 py-4 border-t border-[#1F1F1F] bg-[#141414] space-y-3">
          {dismissing ? (
            /* Override reason form */
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#EDEDED]">
                Override reason <span className="text-[#FF1744]">*</span>
              </p>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#2E2E2E]"
              >
                <option value="">Select reasonâ€¦</option>
                {OVERRIDE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {overrideReason === 'Other' && (
                <textarea
                  value={overrideText}
                  onChange={(e) => setOverrideText(e.target.value)}
                  placeholder="Describe the reason (min 20 characters)â€¦"
                  rows={3}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#2E2E2E] resize-none placeholder:text-[#666666]"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setDismissing(false)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-[#A0A0A0] bg-[#0A0A0A] border border-[#1F1F1F] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!canDismiss}
                  onClick={async () => {
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token || '';
                      
                      const reasonStr = overrideReason + (overrideText ? ` - ${overrideText}` : '');
                      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                      
                      const res = await fetch(`${API_BASE}/api/alerts/${alert.id}/resolve`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                          resolution: 'DISMISSED',
                          override_reason: reasonStr
                        })
                      });
                      
                      if (!res.ok) throw new Error("Failed to dismiss alert");
                      
                      setDismissing(false);
                      setOverrideReason('');
                      setOverrideText('');
                      if (onResolve) onResolve();
                    } catch (e) {
                      console.error("Error dismissing alert", e);
                    }
                  }}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                    canDismiss
                      ? 'bg-[#0A0A0A] border border-[#1F1F1F] text-[#EDEDED] hover:bg-[#1F1F1F]'
                      : 'bg-[#0A0A0A] border border-[#1F1F1F] text-[#666666] cursor-not-allowed opacity-50',
                  )}
                >
                  Confirm Dismiss
                </button>
              </div>
            </div>
          ) : (
            /* Default action buttons */
            <div className="flex gap-2">
              <button
                onClick={() => setDismissing(true)}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#0A0A0A] border border-[#1F1F1F] text-[#EDEDED] hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              >
                âœ… Dismiss Alert
              </button>
              <button className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-[rgba(255,179,0,0.1)] border border-[rgba(255,179,0,0.2)] text-[#FFB300] hover:bg-[rgba(255,179,0,0.15)] transition-colors cursor-pointer">
                âš ï¸ Escalate
              </button>
              <button className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-[rgba(255,23,68,0.1)] border border-[rgba(255,23,68,0.2)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.15)] transition-colors cursor-pointer">
                ðŸš¨ File STR
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#666666]">
          {title}
        </h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[#666666] mb-1">{label}</p>
      <div className={cn('text-sm text-[#EDEDED]', mono && 'font-mono')}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const dotColor: Record<string, string> = {
    PENDING: 'bg-[#FFB300]',
    REVIEWING: 'bg-[#2979FF]',
    RESOLVED: 'bg-[#00C853]',
    ESCALATED: 'bg-[#FF1744]',
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0A0A0A] text-[#A0A0A0] border border-[#1F1F1F]">
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor[status] ?? 'bg-[#666666]')} />
      {status}
    </span>
  );
}


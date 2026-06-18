'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  Settings,
  Shield,
  Database,
  Bell,
  Globe,
  Key,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Settings Page â€” System Configuration for Compliance Platform
   Based on: Module 5 (RBAC), Module 6 (Provider Abstraction), Module 2 (AML Thresholds)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

type Tab = 'general' | 'detection' | 'providers' | 'notifications' | 'rbac';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general',       label: 'General',       icon: <Settings className="w-4 h-4" /> },
  { id: 'detection',     label: 'Detection',     icon: <Shield className="w-4 h-4" /> },
  { id: 'providers',     label: 'Providers',     icon: <Database className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'rbac',          label: 'Access Control', icon: <Key className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#EDEDED]">Settings</h1>
          <p className="text-xs text-[#666666] mt-1">
            Platform configuration and compliance parameters
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-[#00C853]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(41,121,255,0.1)] border border-[rgba(41,121,255,0.2)] text-[#2979FF] hover:bg-[rgba(41,121,255,0.18)] transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* â”€â”€ Tab Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex gap-1 border-b border-[#1F1F1F]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors cursor-pointer -mb-px',
              activeTab === t.id
                ? 'text-[#EDEDED] border-b-2 border-[#2979FF]'
                : 'text-[#666666] hover:text-[#A0A0A0]',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* â”€â”€ Tab Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-3xl">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'detection' && <DetectionTab />}
        {activeTab === 'providers' && <ProvidersTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'rbac' && <RBACTab />}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Tab Components
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function GeneralTab() {
  return (
    <div className="space-y-6">
      <Section title="Organization">
        <Field label="Organization Name" defaultValue="Sentinel Financial Services" />
        <Field label="FIU Registration ID" defaultValue="FIU/REG/2026/0042" mono />
        <Field label="Reporting Entity Code" defaultValue="SFSL-MH-001" mono />
      </Section>
      <Section title="Regional Compliance">
        <SelectField label="Primary Jurisdiction" options={['India (RBI/FIU-IND)', 'Singapore (MAS)', 'UAE (CBUAE)', 'UK (FCA)']} />
        <SelectField label="Currency" options={['INR (â‚¹)', 'USD ($)', 'SGD (S$)', 'AED (Ø¯.Ø¥)']} />
        <SelectField label="Timezone" options={['Asia/Kolkata (IST, UTC+5:30)', 'Asia/Singapore (SGT, UTC+8)', 'UTC']} />
      </Section>
      <Section title="Data Retention">
        <SelectField label="Audit Log Retention" options={['5 years (PMLA minimum)', '7 years', '10 years']} />
        <SelectField label="Transaction History" options={['5 years', '7 years', '10 years']} />
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(255,179,0,0.06)] border border-[rgba(255,179,0,0.15)]">
          <AlertTriangle className="w-4 h-4 text-[#FFB300] shrink-0 mt-0.5" />
          <p className="text-xs text-[#FFB300]">
            PMLA 2002 requires minimum 5-year retention of all KYC records and transaction data.
          </p>
        </div>
      </Section>
    </div>
  );
}

function DetectionTab() {
  return (
    <div className="space-y-6">
      <Section title="Layer 1 â€” Regulatory Rules (Mandatory)" badge={<Badge text="Cannot Disable" />}>
        <div className="space-y-3">
          <RuleRow rule="CTR Threshold" value="â‚¹10,00,000 / month" locked description="PMLA 2002, Rule 3 â€” Cash transaction reporting" />
          <RuleRow rule="Sanctions Screening" value="Enabled" locked description="UN/UAPA list matching, transliteration-normalized" />
          <RuleRow rule="PEP Screening" value="+40 risk score" locked description="RBI KYC Directions 2025" />
        </div>
      </Section>

      <Section title="Layer 2 â€” ML Anomaly Detection">
        <Field label="Isolation Forest Contamination" defaultValue="0.05" type="number" hint="Proportion of outliers (default: 0.05)" />
        <Field label="Anomaly Score Threshold" defaultValue="0.65" type="number" hint="Scores above this trigger alerts" />
        <Field label="Behavioral Baseline Window" defaultValue="90" type="number" hint="Rolling days for per-user baseline" />
        <ToggleField label="SHAP Explainability" defaultChecked description="Show top-3 contributing features in alert detail" />
      </Section>

      <Section title="Layer 3 â€” Graph Intelligence">
        <Field label="Cycle Detection Max Depth" defaultValue="5" type="number" hint="Maximum hops to search for cycles" />
        <Field label="Cycle Time Window" defaultValue="72" type="number" hint="Hours within which cycle must complete" />
        <Field label="Fan-In Threshold" defaultValue="5" type="number" hint="Minimum unique sources to flag fan-in" />
        <ToggleField label="Community Detection (Louvain)" defaultChecked description="Detect isolated transaction clusters" />
        <ToggleField label="Shared Attribute Linking" defaultChecked description="Create edges for shared devices, IPs, phones" />
      </Section>

      <Section title="Risk Scoring">
        <div className="grid grid-cols-4 gap-3">
          <TierConfig label="Green" range="0 â€“ 20" color="#00C853" />
          <TierConfig label="Yellow" range="21 â€“ 60" color="#FFB300" />
          <TierConfig label="Red" range="61 â€“ 99" color="#FF1744" />
          <TierConfig label="Blacklist" range="100" color="#FFFFFF" />
        </div>
      </Section>
    </div>
  );
}

function ProvidersTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(41,121,255,0.06)] border border-[rgba(41,121,255,0.15)] mb-4">
        <Globe className="w-4 h-4 text-[#2979FF] shrink-0 mt-0.5" />
        <p className="text-xs text-[#2979FF]">
          Provider Abstraction Layer â€” toggle between real APIs and smart mocks via environment variables. Demo is fully functional with mocks.
        </p>
      </div>

      <Section title="OCR Provider">
        <SelectField label="Primary" options={['Google Cloud Vision API', 'AWS Textract', 'Pytesseract (local)']} />
        <SelectField label="Fallback" options={['Pytesseract (local)', 'None']} />
        <Field label="Confidence Threshold" defaultValue="0.80" type="number" hint="Below this triggers re-upload guidance" />
        <ProviderStatus name="Google Cloud Vision" status="connected" />
      </Section>

      <Section title="Face Match Provider">
        <SelectField label="Engine" options={['DeepFace (ArcFace backend)', 'AWS Rekognition', 'Mock']} />
        <Field label="Match Threshold" defaultValue="0.55" type="number" hint="Calibrated for South Asian faces (default 0.60 is too strict)" />
        <ProviderStatus name="DeepFace (Local)" status="connected" />
      </Section>

      <Section title="Sanctions Provider">
        <SelectField label="Primary" options={['Local Cache (pg_trgm)', 'OpenSanctions API']} />
        <SelectField label="Secondary" options={['OpenSanctions API', 'None']} />
        <Field label="Fuzzy Match Threshold" defaultValue="0.70" type="number" hint="Trigram similarity threshold" />
        <ToggleField label="Circuit Breaker" defaultChecked description="Auto-queue on 3 consecutive API failures" />
        <ProviderStatus name="Local Sanctions Cache" status="connected" lastSync="2026-02-21 06:00:00 IST" />
      </Section>

      <Section title="Government Verification">
        <SelectField label="PAN Verification" options={['Setu Sandbox', 'Smart Mock']} />
        <SelectField label="Aadhaar Verification" options={['DigiLocker OAuth', 'Smart Mock']} />
        <ProviderStatus name="Setu API" status="sandbox" />
      </Section>

      <Section title="LLM Provider">
        <SelectField label="Provider" options={['Google Gemini 2.0 Flash', 'Groq (Llama)', 'Disabled']} />
        <ToggleField label="Restrict to CRITICAL alerts only" defaultChecked description="LLM narratives only for Tier 3 / CRITICAL severity" />
        <ToggleField label="PII Redaction" defaultChecked description="Redact all PII before LLM inference" />
        <ProviderStatus name="Gemini 2.0 Flash" status="connected" />
      </Section>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <Section title="Alert Notifications">
        <ToggleField label="Critical alerts â†’ Instant push" defaultChecked description="Immediately notify assigned officer" />
        <ToggleField label="High alerts â†’ 5-min digest" defaultChecked description="Batch high-severity alerts every 5 minutes" />
        <ToggleField label="Sanctions match â†’ Email + SMS" defaultChecked description="Multi-channel notification for sanctions hits" />
        <ToggleField label="Chain integrity failure â†’ Email admin" defaultChecked description="Notify admin if audit chain breaks" />
      </Section>
      <Section title="Escalation Rules">
        <Field label="Auto-escalate after" defaultValue="4" type="number" hint="Hours before PENDING alerts auto-escalate to senior" />
        <Field label="SLA warning at" defaultValue="2" type="number" hint="Hours before SLA warning appears on alert" />
      </Section>
      <Section title="Digest Reports">
        <ToggleField label="Daily compliance summary" defaultChecked description="Email daily summary to all officers at 09:00 IST" />
        <ToggleField label="Weekly risk report" defaultChecked description="Weekly aggregate risk metrics to admin" />
      </Section>
    </div>
  );
}

function RBACTab() {
  return (
    <div className="space-y-6">
      <Section title="Role Definitions" badge={<Badge text="PMLA Compliant" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#141414]">
                {['Role', 'View Alerts', 'Resolve', 'Override AI', 'File STR', 'Manage Users', 'Audit Logs'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-medium text-[#666666]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <RBACRow role="Customer" permissions={[false, false, false, false, false, false]} />
              <RBACRow role="Analyst" permissions={[true, false, false, false, false, false]} />
              <RBACRow role="Officer" permissions={[true, true, true, true, false, true]} />
              <RBACRow role="Admin" permissions={[true, true, true, true, true, true]} />
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Active Officers">
        <div className="space-y-2">
          <OfficerRow name="M. Shah" role="COMPLIANCE_OFFICER" status="Active" lastLogin="2026-02-21 14:32" />
          <OfficerRow name="A. Khan" role="COMPLIANCE_OFFICER" status="Active" lastLogin="2026-02-21 13:58" />
          <OfficerRow name="R. Patel" role="COMPLIANCE_ANALYST" status="Active" lastLogin="2026-02-21 13:22" />
          <OfficerRow name="S. Director" role="ADMIN" status="Active" lastLogin="2026-02-21 09:00" />
        </div>
      </Section>

      <Section title="Row-Level Security">
        <ToggleField label="Analysts see only assigned alerts" defaultChecked description="RLS policy: analysts cannot view unassigned or others' alerts" />
        <ToggleField label="Audit logs append-only" defaultChecked description="UPDATE and DELETE revoked on compliance_audit_logs" />
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(255,23,68,0.06)] border border-[rgba(255,23,68,0.15)]">
          <AlertTriangle className="w-4 h-4 text-[#FF1744] shrink-0 mt-0.5" />
          <p className="text-xs text-[#FF1744]">
            Audit log modifications are permanently disabled. This setting cannot be changed at runtime.
          </p>
        </div>
      </Section>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Reusable Form Components
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function Section({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#666666]">{title}</h3>
        {badge}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#0A0A0A] text-[#666666] border border-[#1F1F1F]">
      {text}
    </span>
  );
}

function Field({ label, defaultValue, type = 'text', mono, hint }: { label: string; defaultValue: string; type?: string; mono?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-xs text-[#A0A0A0] mb-1.5">{label}</label>
      <input type={type} defaultValue={defaultValue} className={cn('w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#2E2E2E]', mono && 'font-mono')} />
      {hint && <p className="text-[10px] text-[#666666] mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="block text-xs text-[#A0A0A0] mb-1.5">{label}</label>
      <select defaultValue={options[0]} className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm text-[#EDEDED] outline-none focus:border-[#2E2E2E] cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, defaultChecked, description }: { label: string; defaultChecked?: boolean; description?: string }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start justify-between py-2">
      <div>
        <p className="text-sm text-[#EDEDED]">{label}</p>
        {description && <p className="text-[11px] text-[#666666] mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={on}
        onClick={() => setOn(!on)}
        className={cn('relative w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5', on ? 'bg-[#2979FF]' : 'bg-[#1F1F1F]')}
      >
        <span className={cn('absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform', on && 'translate-x-4')} />
      </button>
    </div>
  );
}

function RuleRow({ rule, value, locked, description }: { rule: string; value: string; locked?: boolean; description: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-[#EDEDED]">{rule}</p>
          {locked && <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(255,23,68,0.1)] text-[#FF1744] border border-[rgba(255,23,68,0.2)]">Locked</span>}
        </div>
        <p className="text-[11px] text-[#666666] mt-0.5">{description}</p>
      </div>
      <span className="font-mono text-xs text-[#A0A0A0]">{value}</span>
    </div>
  );
}

function ProviderStatus({ name, status, lastSync }: { name: string; status: 'connected' | 'sandbox' | 'disconnected'; lastSync?: string }) {
  const color = status === 'connected' ? '#00C853' : status === 'sandbox' ? '#FFB300' : '#FF1744';
  const label = status === 'connected' ? 'Connected' : status === 'sandbox' ? 'Sandbox' : 'Disconnected';
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-[#A0A0A0]">{name}</span>
      <div className="flex items-center gap-2">
        {lastSync && <span className="text-[10px] text-[#666666]">Last sync: {lastSync}</span>}
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium" style={{ color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      </div>
    </div>
  );
}

function TierConfig({ label, range, color }: { label: string; range: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-center">
      <span className="w-3 h-3 rounded-full inline-block mb-1.5" style={{ backgroundColor: color }} />
      <p className="text-xs font-medium text-[#EDEDED]">{label}</p>
      <p className="text-[10px] font-mono text-[#666666]">{range}</p>
    </div>
  );
}

function RBACRow({ role, permissions }: { role: string; permissions: boolean[] }) {
  return (
    <tr className="border-b border-[#1F1F1F]">
      <td className="px-4 py-3 text-sm text-[#EDEDED] font-medium">{role}</td>
      {permissions.map((p, i) => (
        <td key={i} className="px-4 py-3 text-center">
          {p ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853] mx-auto" /> : <span className="text-xs text-[#666666]">â€”</span>}
        </td>
      ))}
    </tr>
  );
}

function OfficerRow({ name, role, status, lastLogin }: { name: string; role: string; status: string; lastLogin: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1F1F1F] flex items-center justify-center text-xs font-bold text-[#A0A0A0]">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm text-[#EDEDED]">{name}</p>
          <p className="text-[10px] font-mono text-[#666666]">{role}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="inline-flex items-center gap-1 text-[10px] text-[#00C853]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" /> {status}
        </span>
        <p className="text-[10px] text-[#666666]">{lastLogin}</p>
      </div>
    </div>
  );
}


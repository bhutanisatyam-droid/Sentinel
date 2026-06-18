import { createSSRClient } from '@/shared/lib/supabase.ssr';
import { getBackendUrl } from '@/shared/config/env';
import DashboardClientView from '@/modules/aml/components/DashboardClientView';
import { RecentAlert } from '@/modules/aml/types/aml.types';

// Force dynamic since we read cookies at request time
export const dynamic = 'force-dynamic';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardOverviewPage() {
  const supabase = await createSSRClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  // 1. Fetch Metrics server-side
  let metrics = null;
  try {
    const res = await fetch(`${getBackendUrl()}/api/dashboard/metrics`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      metrics = await res.json();
    }
  } catch (e) {
    // Silent fail -> fallback metrics will render in client
  }

  // 2. Fetch Recent Alerts server-side
  let recentAlerts: any[] = [];
  try {
    const { data } = await supabase
      .from('alerts')
      .select('id, severity, user_id, alert_type, source, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      recentAlerts = data.map((a: any) => ({
        id: a.id,
        severity: (a.severity || 'medium').toLowerCase(),
        user: a.user_id ? `•••• ${a.user_id.slice(-6)}` : 'Unknown',
        type: a.alert_type || 'Unknown Alert',
        source: (a.source || 'RULE').toUpperCase(),
        time: a.created_at ? timeAgo(a.created_at) : '',
        status: (a.status || 'PENDING').toUpperCase(),
      }));
    }
  } catch (e) {}

  return (
    <DashboardClientView 
      initialMetrics={metrics} 
      initialAlerts={recentAlerts} 
    />
  );
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'ESCALATED';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  user_id: string;
  alert_type: string;
  source: string;
  created_at: string;
  status: AlertStatus;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  sender_id: string;
  receiver_id: string;
  timestamp: string;
  status: string;
}

export interface DashboardMetrics {
  risk_distribution: { tier: string; count: number }[];
  alert_velocity: {
    total_24h: number;
    avg_per_hour: number;
    hourly: { hour: string; alerts: number }[];
  };
  false_positive_rate: number;
  total_resolved: number;
  mttr_hours: number | null;
  top_triggered_rules: { rule: string; count: number }[];
  active_alerts: number;
  pending_kyc_reviews: number;
}

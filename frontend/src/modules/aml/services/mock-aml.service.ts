import { IAmlService } from './aml-service.interface';
import { DashboardMetrics, Alert, Transaction } from '../types/aml.types';

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
  ],
  active_alerts: 47,
  pending_kyc_reviews: 8,
};

export class MockAmlService implements IAmlService {
  async getAlerts(params?: any) {
    return { data: [], count: 0 };
  }
  async resolveAlert(alertId: string, res: string, reason?: string) {
    return { success: true };
  }
  async assignAlert(alertId: string, officerId: string) {
    return { success: true };
  }
  async getTransactions(userId: string) {
    return { data: [], count: 0 };
  }
  async submitTransaction(data: any) {
    return { success: true };
  }
  async getDashboardMetrics() {
    return FALLBACK_METRICS;
  }
  async getMoneyMapGraph() {
    return { nodes: [], links: [] };
  }
}

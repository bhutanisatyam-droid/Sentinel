import { IAmlService } from './aml-service.interface';
import { DashboardMetrics, Alert, Transaction } from '../types/aml.types';
import { apiClient } from '@/shared/lib/api-client';

export class RealAmlService implements IAmlService {
  async getAlerts(params?: any) {
    const qs = new URLSearchParams(params || {}).toString();
    return apiClient.get<{ data: Alert[]; count: number }>(`/alerts?${qs}`);
  }
  
  async resolveAlert(alertId: string, resolution: string, overrideReason?: string) {
    return apiClient.patch(`/alerts/${alertId}/resolve`, { resolution, override_reason: overrideReason || null });
  }

  async assignAlert(alertId: string, officerId: string) {
    return apiClient.post(`/alerts/${alertId}/assign`, { officer_id: officerId });
  }

  async getTransactions(userId: string) {
    return apiClient.get<{ data: Transaction[]; count: number }>(`/transactions/${userId}`);
  }

  async submitTransaction(data: any) {
    return apiClient.post('/transactions/submit', data);
  }

  async getDashboardMetrics() {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  }

  async getMoneyMapGraph() {
    return apiClient.get<any>('/dashboard/graph');
  }
}

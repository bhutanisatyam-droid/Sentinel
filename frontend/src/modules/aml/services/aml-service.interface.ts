import { Alert, DashboardMetrics, Transaction } from '../types/aml.types';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — AML Domain Service Interface
 * ═══════════════════════════════════════════════════════════════
 */
export interface IAmlService {
  getAlerts(params?: any): Promise<{ data: Alert[]; count: number }>;
  resolveAlert(alertId: string, resolution: string, overrideReason?: string): Promise<any>;
  assignAlert(alertId: string, officerId: string): Promise<any>;
  
  getTransactions(userId: string): Promise<{ data: Transaction[]; count: number }>;
  submitTransaction(data: any): Promise<any>;
  
  getDashboardMetrics(): Promise<DashboardMetrics | null>;
  getMoneyMapGraph(): Promise<any>;
}

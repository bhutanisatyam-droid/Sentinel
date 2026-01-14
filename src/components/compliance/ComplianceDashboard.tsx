import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, LogOut, AlertTriangle, Users, FileText, Activity, Eye } from 'lucide-react';
import { AlertsTable } from './AlertsTable';
import { TransactionGraph } from './TransactionGraph';
import { RiskAnalytics } from './RiskAnalytics';
import { UserManagement } from './UserManagement';

interface ComplianceDashboardProps {
  onLogout: () => void;
}

type Tab = 'alerts' | 'analytics' | 'users' | 'reports';

export function ComplianceDashboard({ onLogout }: ComplianceDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('alerts');

  // Mock data
  const stats = {
    totalAlerts: 23,
    highRisk: 5,
    pendingReview: 18,
    totalUsers: 1247,
    verifiedToday: 34,
    flaggedTransactions: 12,
    sarFiled: 3,
  };

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#222222] bg-black bg-opacity-80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
              <span className="text-sm font-medium tracking-tight">Sentinel</span>
            </div>
            <span className="px-3 py-1 bg-[#050505] border border-[#222222] rounded text-xs text-white">
              Compliance Officer
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-[#888888] hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </nav>

      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
              Compliance Control Center
            </h2>
            <p className="text-sm text-[#888888]">Real-time AML monitoring and case management</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#888888]">High Risk Alerts</span>
                <AlertTriangle className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.highRisk}</div>
              <p className="text-xs text-[#888888]">Requires immediate action</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#888888]">Pending Review</span>
                <Eye className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.pendingReview}</div>
              <p className="text-xs text-[#888888]">Medium risk cases</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#888888]">Total Users</span>
                <Users className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
              <p className="text-xs text-[#888888]">{stats.verifiedToday} verified today</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#888888]">SAR Filed</span>
                <FileText className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.sarFiled}</div>
              <p className="text-xs text-[#888888]">This month</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#222222] mb-8">
            <div className="flex gap-8">
              {[
                { id: 'alerts' as const, label: 'Alerts', icon: AlertTriangle },
                { id: 'analytics' as const, label: 'Analytics', icon: Activity },
                { id: 'users' as const, label: 'Users', icon: Users },
                { id: 'reports' as const, label: 'Reports', icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors text-sm ${
                    activeTab === id
                      ? 'border-white text-white'
                      : 'border-transparent text-[#888888] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'alerts' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertsTable />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-6">
                <TransactionGraph />
                <RiskAnalytics />
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <UserManagement />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#222222] bg-[#050505] p-12 rounded text-center"
            >
              <FileText className="w-16 h-16 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
              <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">SAR/CTR Reports</h3>
              <p className="text-sm text-[#888888] mb-6">
                Automated Suspicious Activity and Currency Transaction reporting
              </p>
              <div className="space-y-3 max-w-md mx-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
                >
                  Generate SAR Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full border border-[#222222] text-white py-3 rounded text-sm hover:border-white transition-colors"
                >
                  View Historical Reports
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

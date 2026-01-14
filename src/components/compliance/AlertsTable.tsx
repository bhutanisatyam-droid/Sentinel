import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Eye, CheckCircle, XCircle, Sparkles, TrendingUp } from 'lucide-react';
import { AlertDetailModal } from './AlertDetailModal';

interface Alert {
  id: string;
  userId: string;
  userName: string;
  type: string;
  riskScore: number;
  amount?: number;
  reason: string;
  aiExplanation: string;
  timestamp: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  triggeredRules: string[];
}

export function AlertsTable() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'ALT-8821',
      userId: 'USR-1234',
      userName: 'Vikram Sharma',
      type: 'Structuring',
      riskScore: 92,
      amount: 49000,
      reason: 'Multiple transactions below reporting threshold',
      aiExplanation: 'This transaction pattern exhibits signs of structuring (smurfing). User made 4 consecutive transfers of ₹49,000 within 3 hours, just below the ₹50,000 reporting limit. The velocity and amount precision suggest intentional evasion of CTR filing requirements.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'pending',
      triggeredRules: ['Structuring Tripwire', 'Velocity Check', 'Round Number Hoarding'],
    },
    {
      id: 'ALT-8820',
      userId: 'USR-5678',
      userName: 'Priya Singh',
      type: 'Geo-Velocity',
      riskScore: 87,
      amount: 25000,
      reason: 'Impossible travel speed detected',
      aiExplanation: 'Geo-velocity alert triggered. User logged in from Mumbai at 9:00 AM and made a transaction from London at 10:30 AM. The required travel speed (3,400 mph) is impossible even by commercial flight. This indicates potential account takeover or credential sharing.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'pending',
      triggeredRules: ['Geo-Velocity Tripwire', 'Device Fingerprint Mismatch'],
    },
    {
      id: 'ALT-8819',
      userId: 'USR-9012',
      userName: 'Raj Patel',
      type: 'Profile Mismatch',
      riskScore: 78,
      amount: 500000,
      reason: 'Transaction inconsistent with user profile',
      aiExplanation: 'KYC profile indicates occupation as "Student" with expected monthly income < ₹20,000. However, user received a ₹5,00,000 transfer labeled as "Consulting fees." The transaction value does not match the declared economic profile, suggesting potential money mule activity.',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      status: 'reviewing',
      triggeredRules: ['Contextual Anomaly', 'Profile Mismatch', 'High Value Transaction'],
    },
    {
      id: 'ALT-8818',
      userId: 'USR-3456',
      userName: 'Anita Desai',
      type: 'Dormant Account Wake-Up',
      riskScore: 71,
      amount: 75000,
      reason: 'Inactive account sudden activity',
      aiExplanation: 'Account was dormant for 247 days (last activity: 8 months ago). Suddenly received ₹75,000 and immediately transferred ₹73,500 to a new beneficiary within 15 minutes. This pattern is consistent with compromised credentials sold on dark web marketplaces.',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      status: 'pending',
      triggeredRules: ['Dormant Account Wake-Up', 'Rapid Movement'],
    },
    {
      id: 'ALT-8817',
      userId: 'USR-7890',
      userName: 'Karan Mehta',
      type: 'Circular Flow',
      riskScore: 95,
      amount: 100000,
      reason: 'Money laundering pattern detected',
      aiExplanation: 'Graph Neural Network detected circular flow: User A → User B (₹1,00,000) → User C (₹98,000) → User A (₹96,000) within 18 hours. This wash trading pattern is used to artificially inflate transaction volume or layer illicit funds. All three accounts opened within the same week.',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      status: 'pending',
      triggeredRules: ['Circular Flow', 'New Account Velocity', 'Layering Detection'],
    },
  ]);

  const handleUpdateStatus = (alertId: string, action: 'approved' | 'rejected') => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: action === 'approved' ? 'approved' : 'rejected' }
          : alert
      )
    );
    setSelectedAlert(null);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBg = (score: number) => {
    if (score >= 80) return 'bg-red-500 bg-opacity-10 border-red-500';
    if (score >= 50) return 'bg-yellow-500 bg-opacity-10 border-yellow-500';
    return 'bg-green-500 bg-opacity-10 border-green-500';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-red-500 bg-opacity-10 text-red-500 rounded-full text-xs">Pending</span>;
      case 'reviewing':
        return <span className="px-3 py-1 bg-yellow-500 bg-opacity-10 text-yellow-500 rounded-full text-xs">Reviewing</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-500 bg-opacity-10 text-green-500 rounded-full text-xs">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-gray-500 bg-opacity-10 text-gray-500 rounded-full text-xs">Rejected</span>;
    }
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending' || a.status === 'reviewing');

  return (
    <div className="border border-[#222222] bg-[#050505] rounded">
      <div className="p-6 border-b border-[#222222]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#EDEDED]">Active Alerts</h3>
            <p className="text-xs text-[#888888] mt-1">
              AI-powered risk detection and compliance monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
            <span className="text-xs text-white">AI Analysis Active</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#222222]">
            <tr className="text-left">
              <th className="px-6 py-4 text-xs text-[#888888]">Alert ID</th>
              <th className="px-6 py-4 text-xs text-[#888888]">User</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Type</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Risk Score</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Amount</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Status</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {alerts.map((alert, index) => (
              <motion.tr
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-black transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-[#EDEDED]">{alert.id}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm text-[#EDEDED]">{alert.userName}</p>
                    <p className="text-xs text-[#888888] font-mono">{alert.userId}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[#EDEDED]">{alert.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${alert.riskScore >= 90 ? 'bg-white' :
                        alert.riskScore >= 70 ? 'bg-[#888888]' :
                          'bg-[#444444]'
                      }`} />
                    <span className={`text-sm ${alert.riskScore >= 90 ? 'text-white' :
                        alert.riskScore >= 70 ? 'text-[#EDEDED]' :
                          'text-[#888888]'
                      }`}>
                      {alert.riskScore}/100
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {alert.amount && (
                    <span className="text-sm text-[#EDEDED]">
                      ₹{alert.amount.toLocaleString('en-IN')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs border ${alert.status === 'pending'
                      ? 'bg-[#050505] border-[#222222] text-white'
                      : alert.status === 'reviewing'
                        ? 'bg-black border-[#222222] text-[#888888]'
                        : alert.status === 'approved'
                          ? 'bg-[#050505] border-white text-white'
                          : 'bg-black border-[#222222] text-[#888888]'
                    }`}>
                    {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2 border border-[#222222] rounded hover:border-white transition-colors"
                    >
                      <Eye className="w-4 h-4 text-white" strokeWidth={1.5} />
                    </motion.button>
                    {alert.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdateStatus(alert.id, 'approved')}
                          className="p-2 border border-[#222222] rounded hover:border-white transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdateStatus(alert.id, 'rejected')}
                          className="p-2 border border-[#222222] rounded hover:border-white transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                        </motion.button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedAlert && (
          <AlertDetailModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onApprove={() => {
              handleUpdateStatus(selectedAlert.id, 'approved');
              setSelectedAlert(null);
            }}
            onReject={() => {
              handleUpdateStatus(selectedAlert.id, 'rejected');
              setSelectedAlert(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
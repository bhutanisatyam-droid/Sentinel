import { motion } from 'motion/react';
import { X, User, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, FileText, Network, Sparkles } from 'lucide-react';
import { TransactionGraph } from './TransactionGraph';

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
  status: string;
  triggeredRules: string[];
}

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function AlertDetailModal({ alert, onClose, onApprove, onReject }: AlertDetailModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#050505] border border-[#222222] rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#050505] border-b border-[#222222] px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-medium mb-1 text-[#EDEDED]">Alert Details: {alert.id}</h3>
            <p className="text-sm text-[#888888]">{alert.type} Detection</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black rounded transition-colors border border-[#222222]"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Risk Score */}
          <div className="border border-[#222222] bg-black p-6 rounded">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#888888]">Overall Risk Score</span>
              <div
                className={`text-4xl font-bold ${
                  alert.riskScore >= 80
                    ? 'text-white'
                    : alert.riskScore >= 50
                    ? 'text-[#EDEDED]'
                    : 'text-[#888888]'
                }`}
              >
                {alert.riskScore}/100
              </div>
            </div>
            <div className="h-2 bg-[#050505] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${alert.riskScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${
                  alert.riskScore >= 80
                    ? 'bg-white'
                    : alert.riskScore >= 50
                    ? 'bg-[#EDEDED]'
                    : 'bg-[#888888]'
                }`}
              />
            </div>
          </div>

          {/* User Information */}
          <div className="border border-[#222222] bg-black p-6 rounded">
            <h4 className="text-sm mb-4 flex items-center gap-2 text-[#EDEDED]">
              <User className="w-4 h-4 text-white" strokeWidth={1.5} />
              User Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#888888]">Name:</span>
                <p className="text-[#EDEDED] mt-1">{alert.userName}</p>
              </div>
              <div>
                <span className="text-[#888888]">User ID:</span>
                <p className="text-[#EDEDED] mt-1 font-mono text-xs">{alert.userId}</p>
              </div>
              <div>
                <span className="text-[#888888]">KYC Status:</span>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-3 h-3 text-white" strokeWidth={1.5} />
                  <span className="text-white text-xs">Verified</span>
                </div>
              </div>
              <div>
                <span className="text-[#888888]">Account Age:</span>
                <p className="text-[#EDEDED] mt-1">47 days</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {alert.amount && (
            <div className="border border-[#222222] bg-black p-6 rounded">
              <h4 className="text-sm mb-4 flex items-center gap-2 text-[#EDEDED]">
                <TrendingUp className="w-4 h-4 text-white" strokeWidth={1.5} />
                Transaction Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#888888]">Amount:</span>
                  <p className="text-2xl font-bold mt-1 text-[#EDEDED]">
                    ₹{alert.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-[#888888]">Timestamp:</span>
                  <p className="text-[#EDEDED] mt-1">
                    {new Date(alert.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-[#888888]">Average Transaction:</span>
                  <p className="text-[#EDEDED] mt-1">₹2,500</p>
                </div>
                <div>
                  <span className="text-[#888888]">Deviation:</span>
                  <p className="text-white mt-1">1,860% above normal</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Explanation */}
          <div className="border border-[#222222] bg-black p-6 rounded">
            <h4 className="text-sm mb-3 flex items-center gap-2 text-[#EDEDED]">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
              AI-Generated Risk Analysis
            </h4>
            <p className="text-sm text-[#888888] leading-relaxed">{alert.aiExplanation}</p>
          </div>

          {/* Triggered Rules */}
          <div className="border border-[#222222] bg-black p-6 rounded">
            <h4 className="text-sm mb-4 flex items-center gap-2 text-[#EDEDED]">
              <FileText className="w-4 h-4 text-white" strokeWidth={1.5} />
              Triggered AML Rules ({alert.triggeredRules.length})
            </h4>
            <div className="space-y-2">
              {alert.triggeredRules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#050505] rounded border border-[#222222]">
                  <div className="w-2 h-2 rounded-full bg-white" />
                  <span className="text-sm text-[#EDEDED]">{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Flow Graph */}
          <div>
            <h4 className="text-sm mb-4 flex items-center gap-2 text-[#EDEDED]">
              <Network className="w-4 h-4 text-white" strokeWidth={1.5} />
              Transaction Flow Network
            </h4>
            <TransactionGraph alertType={alert.type} />
          </div>

          {/* Recommended Actions */}
          <div className="border border-[#222222] bg-black p-6 rounded">
            <h4 className="text-sm mb-4 text-[#EDEDED]">Recommended Actions</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-[#050505] border border-[#222222] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">1</span>
                </div>
                <div>
                  <p className="text-[#EDEDED] mb-1">Freeze Account Immediately</p>
                  <p className="text-[#888888] text-xs">
                    Prevent further transactions until investigation complete
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-[#050505] border border-[#222222] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">2</span>
                </div>
                <div>
                  <p className="text-[#EDEDED] mb-1">Request Additional Documentation</p>
                  <p className="text-[#888888] text-xs">Source of funds verification required</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-[#050505] border border-[#222222] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">3</span>
                </div>
                <div>
                  <p className="text-[#EDEDED] mb-1">File SAR Report</p>
                  <p className="text-[#888888] text-xs">
                    Submit Suspicious Activity Report to FIU-IND within 7 days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {(alert.status === 'pending' || alert.status === 'reviewing') && (
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onApprove}
                className="flex-1 bg-white text-black py-4 rounded hover:bg-[#EDEDED] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <CheckCircle className="w-5 h-5" strokeWidth={1.5} />
                Approve Transaction
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReject}
                className="flex-1 bg-[#050505] text-white border border-[#222222] py-4 rounded hover:border-white transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <XCircle className="w-5 h-5" strokeWidth={1.5} />
                Reject & Block Account
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

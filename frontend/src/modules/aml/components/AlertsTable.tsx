import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { AlertDetailModal } from './AlertDetailModal';
import { apiClient as api } from '@/shared/lib/api-client';

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

// Map backend alert status to UI status
function mapStatus(backendStatus: string): Alert['status'] {
    switch (backendStatus?.toUpperCase()) {
        case 'OPEN': case 'NEW': return 'pending';
        case 'INVESTIGATING': case 'IN_REVIEW': return 'reviewing';
        case 'RESOLVED': return 'approved';
        case 'DISMISSED': return 'rejected';
        default: return 'pending';
    }
}

// Map a backend alert row to the UI Alert interface
function mapAlert(raw: any): Alert {
    let parsedDetails: any = {};
    if (typeof raw.details === 'string') {
        try { parsedDetails = JSON.parse(raw.details); } catch {}
    } else if (typeof raw.details === 'object' && raw.details) {
        parsedDetails = raw.details;
    }

    return {
        id: raw.id || '',
        userId: raw.user_id || '',
        userName: raw.user_name || raw.user_id?.slice(0, 8) || 'Unknown',
        type: raw.rule_name || raw.alert_type || raw.summary?.split(' ')[0] || 'Alert',
        riskScore: raw.risk_score ?? raw.priority_rank ?? 50,
        amount: raw.amount ?? parsedDetails.amount ?? parsedDetails.transaction_amount ?? undefined,
        reason: raw.summary || raw.description || raw.rule_name || '',
        aiExplanation: raw.llm_explanation || raw.summary || 'No AI explanation available.',
        timestamp: raw.created_at || new Date().toISOString(),
        status: mapStatus(raw.status),
        triggeredRules: raw.triggered_rules
            ? (Array.isArray(raw.triggered_rules) ? raw.triggered_rules : [raw.triggered_rules])
            : raw.rule_name ? [raw.rule_name] : [],
    };
}

export function AlertsTable() {
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = () => {
        setLoading(true);
        api.getAlerts({ per_page: 50 }).then((res) => {
            const mapped = (res.data || []).map(mapAlert);
            setAlerts(mapped);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleUpdateStatus = async (alertId: string, action: 'approved' | 'rejected') => {
        try {
            const resolution = action === 'approved' ? 'LEGITIMATE' : 'DISMISSED';
            await api.resolveAlert(alertId, resolution);
            // Refresh alerts from backend after resolution
            fetchAlerts();
        } catch (err) {
            console.error('Failed to resolve alert', err);
            // Optimistic local update as fallback
            setAlerts((prev) =>
                prev.map((alert) =>
                    alert.id === alertId
                        ? { ...alert, status: action === 'approved' ? 'approved' : 'rejected' }
                        : alert
                )
            );
        }
        setSelectedAlert(null);
    };

    return (
        <div className="border border-[#222222] bg-[#050505] rounded">
            <div className="p-6 border-b border-[#222222]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-[#EDEDED]">Active Alerts</h3>
                        <p className="text-xs text-[#888888] mt-1">
                            {loading ? 'Loading...' : `${alerts.length} alerts from Supabase`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
                        <span className="text-xs text-white">AI Analysis Active</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="p-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#444]" strokeWidth={1.5} />
                    <p className="text-sm text-[#888888]">No active alerts â€” all clear</p>
                </div>
            ) : (
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
                                        <span className="text-xs font-mono text-[#EDEDED]">{alert.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm text-[#EDEDED]">{alert.userName}</p>
                                            <p className="text-xs text-[#888888] font-mono">{alert.userId.slice(0, 12)}</p>
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
                                        {alert.amount ? (
                                            <span className="text-sm text-[#EDEDED]">
                                                â‚¹{alert.amount.toLocaleString('en-IN')}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[#555]">â€”</span>
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
            )}

            <AnimatePresence>
                {selectedAlert && (
                    <AlertDetailModal
                        alert={selectedAlert}
                        onClose={() => setSelectedAlert(null)}
                        onApprove={() => {
                            handleUpdateStatus(selectedAlert.id, 'approved');
                        }}
                        onReject={() => {
                            handleUpdateStatus(selectedAlert.id, 'rejected');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}


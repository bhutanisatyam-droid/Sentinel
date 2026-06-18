import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

interface RiskAnalyticsProps {
    metrics?: any;
}

export function RiskAnalytics({ metrics }: RiskAnalyticsProps) {
    // Derive risk distribution from metrics or show empty
    const riskDistribution = (() => {
        if (!metrics?.risk_distribution) return [];
        const tiers = metrics.risk_distribution as { tier: string; count: number }[];
        const total = tiers.reduce((s, t) => s + t.count, 0);
        return tiers.map((t) => ({
            category: t.tier === 'LOW' ? 'Low Risk' : t.tier === 'MEDIUM' ? 'Medium Risk' : t.tier === 'HIGH' ? 'High Risk' : t.tier,
            count: t.count,
            percentage: total > 0 ? Math.round((t.count / total) * 100) : 0,
            color: t.tier === 'HIGH' || t.tier === 'BLACKLIST' ? 'bg-white' : t.tier === 'MEDIUM' ? 'bg-[#EDEDED]' : 'bg-[#888888]',
        }));
    })();

    const totalUsers = riskDistribution.reduce((s, r) => s + r.count, 0);

    // Derive top risk patterns from metrics
    const topRiskPatterns = (() => {
        if (!metrics?.top_triggered_rules) return [];
        return (metrics.top_triggered_rules as { rule: string; count: number }[]).map((r) => ({
            pattern: r.rule,
            incidents: r.count,
        }));
    })();

    const loading = !metrics;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <div className="border border-[#222222] bg-[#050505] rounded p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-[#EDEDED]">Risk Distribution</h3>
                        <p className="text-xs text-[#888888] mt-1">User base segmentation</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>

                {loading ? (
                    <div className="py-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
                    </div>
                ) : riskDistribution.length === 0 ? (
                    <p className="text-sm text-[#888888] py-4">No risk data available</p>
                ) : (
                    <div className="space-y-4">
                        {riskDistribution.map((item, index) => (
                            <motion.div
                                key={item.category}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#EDEDED]">{item.category}</span>
                                    <span className="text-xs text-[#888888]">
                                        {item.count} users ({item.percentage}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(item.percentage, 2)}%` }}
                                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                                        className={`h-full ${item.color}`}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-[#222222]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[#888888]">Total Users</span>
                        <span className="text-sm font-medium text-[#EDEDED]">{totalUsers.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Top Risk Patterns */}
            <div className="border border-[#222222] bg-[#050505] rounded p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-[#EDEDED]">Top Triggered Rules</h3>
                        <p className="text-xs text-[#888888] mt-1">Most common alert triggers</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>

                {loading ? (
                    <div className="py-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
                    </div>
                ) : topRiskPatterns.length === 0 ? (
                    <p className="text-sm text-[#888888] py-4">No triggered rules data</p>
                ) : (
                    <div className="space-y-4">
                        {topRiskPatterns.map((pattern, index) => (
                            <motion.div
                                key={pattern.pattern}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 border border-[#222222] rounded bg-black"
                            >
                                <div>
                                    <p className="text-sm text-[#EDEDED] mb-1">{pattern.pattern}</p>
                                    <p className="text-xs text-[#888888]">{pattern.incidents} incidents</p>
                                </div>
                                <TrendingUp className="w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

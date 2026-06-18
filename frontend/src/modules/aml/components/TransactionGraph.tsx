import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2 } from 'lucide-react';
import { apiClient as api } from '@/shared/lib/api-client';

interface TransactionGraphProps {
    alertType?: string;
}

interface GraphEdge {
    from: string;
    to: string;
    amount: number;
    suspicious: boolean;
}

export function TransactionGraph({ alertType }: TransactionGraphProps) {
    const [transactions, setTransactions] = useState<GraphEdge[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ nodeCount: 0, edgeCount: 0, cycleCount: 0 });

    useEffect(() => {
        api.getDashboardGraph().then((data) => {
            if (data?.edges && Array.isArray(data.edges)) {
                const mapped = data.edges.slice(0, 20).map((edge: any) => ({
                    from: edge.source_name || edge.source?.slice(0, 8) || 'User',
                    to: edge.target_name || edge.target?.slice(0, 8) || 'User',
                    amount: edge.total_amount || edge.amount || 0,
                    suspicious: edge.is_suspicious ?? (edge.total_amount > 50000),
                }));
                setTransactions(mapped);
                setStats({
                    nodeCount: data.stats?.nodeCount || 0,
                    edgeCount: data.stats?.edgeCount || 0,
                    cycleCount: data.stats?.cycleCount || 0,
                });
            }
            setLoading(false);
        });
    }, []);

    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const suspiciousCount = transactions.filter(t => t.suspicious).length;

    return (
        <div className="border border-[#222222] bg-[#050505] rounded p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-medium text-[#EDEDED]">Transaction Flow</h3>
                    <p className="text-xs text-[#888888] mt-1">Network analysis visualization</p>
                </div>
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>

            {loading ? (
                <div className="py-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-[#888888]">No transaction flow data available</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[#888888]">{tx.from}</span>
                                    <span className="text-xs text-[#888888]">&rarr;</span>
                                    <span className="text-xs text-[#888888]">{tx.to}</span>
                                </div>
                                <div className="h-2 bg-black rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                                        className={`h-full ${tx.suspicious ? 'bg-white' : 'bg-[#888888]'
                                            }`}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-[#EDEDED]">
                                        â‚¹{tx.amount.toLocaleString('en-IN')}
                                    </span>
                                    {tx.suspicious && (
                                        <span className="text-xs text-white">Flagged</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-[#222222]">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-white">{stats.nodeCount || transactions.length}</p>
                        <p className="text-xs text-[#888888] mt-1">Nodes</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{stats.edgeCount || suspiciousCount}</p>
                        <p className="text-xs text-[#888888] mt-1">Edges</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">
                            {stats.cycleCount > 0 ? stats.cycleCount : `â‚¹${totalVolume.toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-xs text-[#888888] mt-1">{stats.cycleCount > 0 ? 'Cycles' : 'Volume'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


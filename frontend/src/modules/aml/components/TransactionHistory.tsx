import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Brain } from 'lucide-react';

interface Transaction {
    id: string;
    type?: 'credit' | 'debit';
    transaction_type?: string;
    amount: number;
    recipient?: string;
    counterparty_id?: string;
    date?: string;
    created_at?: string;
    timestamp?: string;
    status?: 'completed' | 'pending' | 'pending_review' | 'blocked';
    flagged?: boolean;
    flagReason?: string;
    llm_explanation?: string;
    risk_score?: number;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
    const [expandedTxn, setExpandedTxn] = useState<string | null>(null);
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTxnType = (txn: Transaction): 'credit' | 'debit' => {
        if (txn.type) return txn.type;
        if (txn.transaction_type === 'CASH_DEPOSIT') return 'credit';
        return 'debit';
    };

    const getTxnDate = (txn: Transaction): string => {
        return txn.date || txn.created_at || txn.timestamp || new Date().toISOString();
    };

    const getTxnRecipient = (txn: Transaction): string => {
        return txn.recipient || txn.counterparty_id || 'Unknown';
    };

    const getTxnStatus = (txn: Transaction): string => {
        if (txn.flagged) return 'pending_review';
        return txn.status || 'completed';
    };

    if (transactions.length === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[#161616] p-12 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-[#444]" strokeWidth={1.5} />
                <h3 className="text-sm font-medium mb-1 text-[#EDEDED] uppercase tracking-wider">No Transactions</h3>
                <p className="text-xs text-[#666]">Your transaction history will appear here</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0A0A0A] border border-[#161616]">
            <div className="p-5 border-b border-[#161616]">
                <h3 className="text-sm font-medium text-[#EDEDED] uppercase tracking-wider">Transaction History</h3>
                <p className="text-xs text-[#666] mt-1">Recent account activity</p>
            </div>

            <div className="divide-y divide-[#161616]">
                {transactions.map((transaction, index) => {
                    const txType = getTxnType(transaction);
                    const txDate = getTxnDate(transaction);
                    const txRecipient = getTxnRecipient(transaction);
                    const txStatus = getTxnStatus(transaction);
                    const isExpanded = expandedTxn === transaction.id;
                    const hasExplanation = !!transaction.llm_explanation || !!transaction.flagReason;

                    return (
                        <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-[#111] transition-colors"
                        >
                            <div 
                                className={`p-5 ${hasExplanation ? 'cursor-pointer' : ''}`}
                                onClick={() => hasExplanation && setExpandedTxn(isExpanded ? null : transaction.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-10 h-10 rounded-full border border-[#222] flex items-center justify-center ${txType === 'credit' ? 'bg-[#111]' : 'bg-transparent'
                                                }`}
                                        >
                                            {txType === 'credit' ? (
                                                <ArrowDownLeft className="w-4 h-4 text-[#EDEDED]" strokeWidth={1.5} />
                                            ) : (
                                                <ArrowUpRight className="w-4 h-4 text-[#888]" strokeWidth={1.5} />
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-[#EDEDED]">
                                                {txType === 'credit' ? 'Received from' : 'Sent to'} {txRecipient}
                                            </p>
                                            <p className="text-xs text-[#666] mt-1 font-mono">{formatDate(txDate)}</p>
                                            {transaction.flagged && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <AlertCircle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                                                    <p className="text-xs text-amber-500">Flagged for review</p>
                                                    {transaction.risk_score != null && (
                                                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-mono">
                                                            Risk: {transaction.risk_score}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-medium font-mono ${txType === 'credit' ? 'text-white' : 'text-[#EDEDED]'
                                                    }`}
                                            >
                                                {txType === 'credit' ? '+' : '-'}₹
                                                {transaction.amount.toLocaleString('en-IN')}
                                            </p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1.5">
                                                {txStatus === 'completed' && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                        <span className="text-xs text-emerald-500 uppercase tracking-wider">Completed</span>
                                                    </>
                                                )}
                                                {(txStatus === 'pending_review' || txStatus === 'blocked') && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                        <span className="text-xs text-amber-500 uppercase tracking-wider">
                                                            {txStatus === 'blocked' ? 'Blocked' : 'Review'}
                                                        </span>
                                                    </>
                                                )}
                                                {txStatus === 'pending' && (
                                                    <>
                                                        <div className="w-1 h-1 rounded-full bg-[#888]" />
                                                        <span className="text-xs text-[#888] uppercase tracking-wider">Pending</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {hasExplanation && (
                                            <div className="text-[#666]">
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && hasExplanation && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mx-5 mb-5 p-4 border border-[#222] bg-[#080808] rounded">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Brain className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                                                <h4 className="text-xs font-medium text-amber-500 uppercase tracking-wider">AI Analysis</h4>
                                            </div>
                                            {transaction.llm_explanation && (
                                                <p className="text-xs text-[#CCCCCC] leading-relaxed whitespace-pre-wrap">
                                                    {transaction.llm_explanation}
                                                </p>
                                            )}
                                            {transaction.flagReason && !transaction.llm_explanation && (
                                                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                                                    {transaction.flagReason}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

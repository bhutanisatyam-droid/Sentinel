'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiClient as api } from '../../lib/api';
import { Shield, LogOut, Send, History, User, TrendingUp, Building2, Menu, X } from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import { TransactionHistory } from './TransactionHistory';

interface BankAccount {
    id: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    bankName: string;
    accountType: 'savings' | 'current';
    isPrimary: boolean;
}

interface UserDashboardProps {
    onLogout: () => void;
    bankAccounts: BankAccount[];
    initialTab?: Tab;
    user: any;
}

type Tab = 'send' | 'history' | 'accounts' | 'profile';

export function UserDashboard({ onLogout, bankAccounts: initialBankAccounts, initialTab = 'send', user }: UserDashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [balance, setBalance] = useState<number | null>(user?.balance ?? null);
    const [riskScore] = useState<number | null>(user?.riskScore ?? null);
    const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    const handleDeposit = async () => {
        if (!depositAmount || Number(depositAmount) <= 0) return;
        try {
            const res = await api.deposit(user.id, Number(depositAmount));
            setBalance(res.balance);
            setTransactions((prev) => [res.transaction, ...prev]);
            setIsDepositModalOpen(false);
            setDepositAmount('');
        } catch (err) {
            console.error("Deposit failed", err);
            alert("Failed to deposit money");
        }
    };

    useEffect(() => {
        if (user?.id) {
            api.getTransactions(user.id)
                .then((data) => {
                    const txns = Array.isArray(data) ? data : data.data || data.transactions || [];
                    setTransactions(txns);
                })
                .catch(() => {
                    // Silently handle â€” user may not have transactions yet or auth may be missing
                    setTransactions([]);
                });
        }
    }, [user]);

    const handleNewTransaction = async (transactionData: any) => {
        try {
            const result = await api.submitTransaction({
                ...transactionData,
                fromUserId: transactionData.senderId || user.id
            });
            
            // Refresh transactions list to fetch the newly submitted and evaluated transaction
            api.getTransactions(user.id)
                .then((data) => {
                    setTransactions(Array.isArray(data) ? data : data.transactions || []);
                })
                .catch((err) => console.error("Failed to fetch transactions", err));

            setBalance((prev) => prev !== null ? prev - transactionData.amount : null);
            
            // Map the /submit response verdict to the UI result format that TransactionForm expects
            return {
                id: result.transaction_id,
                status: result.verdict === 'BLOCK' ? 'blocked' : (result.verdict === 'REVIEW' || result.verdict === 'FLAG' ? 'flagged' : 'completed'),
                riskScore: result.risk_score,
                aiExplanation: result.llm_explanation || (result.layers?.rules?.triggered?.length > 0 ? result.layers.rules.triggered.map((r: any) => r.rule_name).join(' â€¢ ') : null),
                llm_explanation: result.llm_explanation,
                flagged: result.verdict !== 'ALLOW'
            };
        } catch (err) {
            console.error("Transaction failed", err);
            return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#060606] text-white pb-12">
            {/* Header */}
            <nav className="sticky top-0 w-full z-50 border-b border-[#161616] bg-[#0A0A0A]">
                <div className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between h-12">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="text-[#666] hover:text-[#EDEDED] transition-colors"
                        >
                            {menuOpen ? (
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            ) : (
                                <Menu className="w-4 h-4" strokeWidth={1.5} />
                            )}
                        </button>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#EDEDED]" strokeWidth={1.5} />
                            <span className="text-sm font-medium tracking-tight text-[#EDEDED]">Sentinel User</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setLogoutConfirmOpen(true)}
                        className="flex items-center gap-2 text-[#666] hover:text-[#EDEDED] transition-colors text-xs uppercase tracking-wider"
                    >
                        <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Logout
                    </button>
                </div>

                {/* Hamburger Dropdown Menu */}
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-12 left-0 w-full border-b border-[#161616] bg-[#0A0A0A] overflow-hidden"
                    >
                        <div className="max-w-4xl mx-auto px-6 py-2">
                            {[
                                { id: 'send' as const, label: 'Send Money', icon: Send },
                                { id: 'history' as const, label: 'History', icon: History },
                                { id: 'accounts' as const, label: 'Bank Accounts', icon: Building2 },
                                { id: 'profile' as const, label: 'Profile', icon: User },
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => { setActiveTab(id); setMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-colors ${activeTab === id
                                        ? 'bg-[#050505] text-white'
                                        : 'text-[#888888] hover:bg-[#050505] hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </nav>

            <div className="px-6 pt-8">
                <div className="max-w-4xl mx-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0A0A0A] border border-[#161616] p-5 flex items-center justify-between"
                        >
                            <div>
                                <p className="text-xs text-[#666] uppercase tracking-wider mb-1">Available Balance</p>
                                <h3 className="text-xl font-medium text-[#EDEDED] font-mono">
                                    {balance === null || balance === undefined
                                        ? <span className="text-[#555] italic">NULL</span>
                                        : `â‚¹${balance.toLocaleString('en-IN')}`}
                                </h3>
                            </div>
                            <TrendingUp className="w-5 h-5 text-[#444]" />
                        </motion.div>

                        {/* Deposit Modal */}
                        {isDepositModalOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-[#050505] border border-[#222222] p-6 rounded w-full max-w-sm"
                                >
                                    <h3 className="text-xl font-bold text-white mb-4">Add Money</h3>
                                    <p className="text-sm text-[#888888] mb-4">Enter amount to deposit into your wallet.</p>

                                    <input
                                        type="number"
                                        className="w-full bg-black border border-[#222222] text-white p-3 rounded mb-4 focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                                        placeholder="Amount (e.g. 1000)"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                    />

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setIsDepositModalOpen(false)}
                                            className="px-4 py-2 text-[#888888] hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeposit}
                                            className="px-4 py-2 bg-white hover:bg-[#EDEDED] text-black font-medium rounded"
                                        >
                                            Deposit
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Logout Confirmation Modal */}
                        {logoutConfirmOpen && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-[#050505] border border-[#222222] p-6 rounded w-full max-w-sm"
                                >
                                    <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                                    <p className="text-sm text-[#888888] mb-6">Are you sure you want to log out of your account?</p>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setLogoutConfirmOpen(false)}
                                            className="px-4 py-2 text-[#888888] hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={onLogout}
                                            className="px-4 py-2 bg-white hover:bg-[#EDEDED] text-black font-medium rounded"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0A0A0A] border border-[#161616] p-5 flex items-center justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs text-[#666] uppercase tracking-wider">Risk Score</p>
                                    <Shield className="w-3 h-3 text-[#444]" />
                                </div>
                                {riskScore === null || riskScore === undefined ? (
                                    <div className="text-xl font-medium text-[#555] font-mono italic">NULL</div>
                                ) : (
                                    <div className="text-xl font-medium text-[#EDEDED] font-mono">{riskScore}/100</div>
                                )}
                                {user?.riskBasis && (
                                    <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
                                        Based on: {user.riskBasis === 'transactions' ? 'Transaction History' : 'KYC Profile'}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-[#888] mb-1">Status</p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    {riskScore === null || riskScore === undefined ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#555]" />
                                            <span className="text-xs text-[#555] italic">N/A</span>
                                        </>
                                    ) : riskScore <= 30 ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-xs text-emerald-500">Trusted</span>
                                        </>
                                    ) : riskScore <= 60 ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span className="text-xs text-amber-500">Moderate</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-xs text-red-500">High Risk</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#0A0A0A] border border-[#161616] p-5 flex items-center justify-between"
                        >
                            <div>
                                <p className="text-xs text-[#666] uppercase tracking-wider mb-1">Transactions</p>
                                <div className="text-xl font-medium text-[#EDEDED] font-mono">{transactions.length}</div>
                            </div>
                            <History className="w-5 h-5 text-[#444]" />
                        </motion.div>
                    </div>



                    {/* Tab Content */}
                    {activeTab === 'send' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <TransactionForm
                                balance={balance ?? 0}
                                bankAccounts={bankAccounts}
                                onTransactionSubmit={handleNewTransaction}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <TransactionHistory transactions={transactions} />
                        </motion.div>
                    )}

                    {activeTab === 'accounts' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {bankAccounts.length > 0 ? (
                                <div className="space-y-4">
                                    {bankAccounts.map((account) => (
                                        <div
                                            key={account.id}
                                            className="border border-[#222222] bg-[#050505] p-6 rounded"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                                                    <h3 className="text-sm font-medium text-[#EDEDED]">
                                                        {account.bankName}
                                                    </h3>
                                                    {account.isPrimary && (
                                                        <span className="px-2 py-0.5 bg-white text-black text-xs rounded">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-[#888888] mb-1">Account Number</p>
                                                    <p className="text-sm text-[#EDEDED]">
                                                        â€¢â€¢â€¢â€¢{account.accountNumber.slice(-4)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#888888] mb-1">IFSC Code</p>
                                                    <p className="text-sm text-[#EDEDED]">{account.ifscCode}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#888888] mb-1">Account Holder</p>
                                                    <p className="text-sm text-[#EDEDED]">{account.accountHolderName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#888888] mb-1">Account Type</p>
                                                    <p className="text-sm text-[#EDEDED] capitalize">
                                                        {account.accountType}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-[#222222] bg-[#050505] p-12 rounded text-center">
                                    <Building2 className="w-12 h-12 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
                                    <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">
                                        No Bank Accounts Linked
                                    </h3>
                                    <p className="text-sm text-[#888888] mb-6">
                                        Add a bank account to enable instant transfers
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-[#222222] bg-[#050505] p-8 rounded"
                        >
                            <h3 className="text-lg font-medium mb-6 text-[#EDEDED]">Profile Information</h3>
                            <div className="space-y-4">
                                <div className="pb-4 border-b border-[#222222]">
                                    <label className="block text-xs text-[#888888] mb-1">Full Name</label>
                                    <p className="text-sm text-[#EDEDED]">{user?.name || 'User'}</p>
                                </div>
                                <div className="pb-4 border-b border-[#222222]">
                                    <label className="block text-xs text-[#888888] mb-1">Email / Phone</label>
                                    <p className="text-sm text-[#EDEDED]">{user?.email || user?.phone || 'Not provided'}</p>
                                </div>
                                <div className="pb-4 border-b border-[#222222]">
                                    <label className="block text-xs text-[#888888] mb-1">KYC Status</label>
                                    <div className="flex items-center gap-2">
                                        {user?.kycStatus === 'VERIFIED' || user?.kycStatus === 'APPROVED' ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <p className="text-sm text-emerald-500">Verified</p>
                                            </>
                                        ) : user?.kycStatus === 'PENDING' || user?.kycStatus === 'PENDING_REVIEW' ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                <p className="text-sm text-amber-500">Pending Review</p>
                                            </>
                                        ) : user?.kycStatus === 'REJECTED' ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <p className="text-sm text-red-500">Rejected</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                                <p className="text-sm text-white">{user?.kycStatus || 'Unknown'}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="pb-4 border-b border-[#222222]">
                                    <label className="block text-xs text-[#888888] mb-1">Account Type</label>
                                    <p className="text-sm text-[#EDEDED]">Individual</p>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#888888] mb-1">Member Since</label>
                                    <p className="text-sm text-[#EDEDED]">
                                        {user?.createdAt 
                                            ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                                            : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
}


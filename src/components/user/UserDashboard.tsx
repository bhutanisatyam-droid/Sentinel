import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { motion } from 'motion/react';
import { Shield, LogOut, Send, History, User, TrendingUp, Building2, Code } from 'lucide-react';
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
  user: any; // Added user prop
}

type Tab = 'send' | 'history' | 'accounts' | 'profile';

export function UserDashboard({ onLogout, bankAccounts: initialBankAccounts, initialTab = 'send', user }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [balance, setBalance] = useState(user?.balance || 0); // Use user balance
  const [riskScore] = useState(user?.riskScore || 15);
  const [bankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Deposit Feature State
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

  // Fetch transactions on load
  useEffect(() => {
    if (user?.id) {
      api.getTransactions(user.id)
        .then((data) => {
          // Assuming backend returns { transactions: [...] } or array
          setTransactions(Array.isArray(data) ? data : data.transactions || []);
        })
        .catch((err) => console.error("Failed to fetch transactions", err));
    }
  }, [user]);

  const handleNewTransaction = async (transactionData: any) => {
    // Optimistic update or wait for API? Let's call API.
    try {
      const newTx = await api.createTransaction({
        ...transactionData,
        fromUserId: user.id
      });
      setTransactions((prev) => [newTx, ...prev]);
      setBalance((prev) => prev - transactionData.amount); // Update local balance
      return newTx;
    } catch (err) {
      console.error("Transaction failed", err);
      // Error handling visual feedback would be good here
      return null;
    }
  };

  return (
    <div className="min-h-screen text-white pb-12">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#222222] bg-black bg-opacity-80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-tight">Sentinel</span>
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
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
            </h2>
            <p className="text-sm text-[#888888]">Your account is verified and ready to use</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-[#888888]">Available Balance</p>
                  <h3 className="text-2xl font-bold text-[#EDEDED] flex items-center gap-3">
                    ₹{balance.toLocaleString('en-IN')}

                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Deposit Modal */}
            {isDepositModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#111] border border-[#333] p-6 rounded-xl w-full max-w-sm"
                >
                  <h3 className="text-xl font-bold text-white mb-4">Add Money</h3>
                  <p className="text-sm text-gray-400 mb-4">Enter amount to deposit into your wallet.</p>

                  <input
                    type="number"
                    className="w-full bg-[#222] border border-[#444] text-white p-3 rounded mb-4 focus:outline-none focus:border-blue-500"
                    placeholder="Amount (e.g. 1000)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsDepositModalOpen(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeposit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                    >
                      Deposit
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#888888]">Risk Score</span>
                <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold mb-1 text-[#EDEDED]">{riskScore}/100</div>
              <p className="text-xs text-white">Low Risk - Trusted User</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-[#222222] bg-[#050505] p-6 rounded"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#888888]">Total Transactions</span>
                <History className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-bold mb-1 text-[#EDEDED]">{transactions.length}</div>
              <p className="text-xs text-white">All completed</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#222222] mb-8">
            <div className="flex gap-8">
              {[
                { id: 'send' as const, label: 'Send Money', icon: Send },
                { id: 'history' as const, label: 'History', icon: History },
                { id: 'accounts' as const, label: 'Bank Accounts', icon: Building2 },
                { id: 'profile' as const, label: 'Profile', icon: User },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors text-sm ${activeTab === id
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
          {activeTab === 'send' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TransactionForm
                balance={balance}
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
                            ••••{account.accountNumber.slice(-4)}
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
                    <div className="w-2 h-2 rounded-full bg-white" />
                    <p className="text-sm text-white">Verified</p>
                  </div>
                </div>
                <div className="pb-4 border-b border-[#222222]">
                  <label className="block text-xs text-[#888888] mb-1">Account Type</label>
                  <p className="text-sm text-[#EDEDED]">Individual</p>
                </div>
                <div>
                  <label className="block text-xs text-[#888888] mb-1">Member Since</label>
                  <p className="text-sm text-[#EDEDED]">December 2025</p>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
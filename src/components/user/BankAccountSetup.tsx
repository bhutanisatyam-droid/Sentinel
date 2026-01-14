import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Plus, Trash2, CheckCircle, X, CreditCard } from 'lucide-react';

interface BankAccount {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  accountType: 'savings' | 'current';
  isPrimary: boolean;
}

interface BankAccountSetupProps {
  onComplete: (accounts: BankAccount[]) => void;
  onSkip: () => void;
}

export function BankAccountSetup({ onComplete, onSkip }: BankAccountSetupProps) {
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankName: '',
    accountType: 'savings' as const,
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      alert('Account numbers do not match');
      return;
    }

    const newAccount: BankAccount = {
      id: `BANK-${Date.now()}`,
      accountNumber: formData.accountNumber,
      accountHolderName: formData.accountHolderName,
      ifscCode: formData.ifscCode,
      bankName: formData.bankName,
      accountType: formData.accountType,
      isPrimary: accounts.length === 0,
    };

    setAccounts([...accounts, newAccount]);
    setFormData({
      accountNumber: '',
      confirmAccountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      bankName: '',
      accountType: 'savings',
    });
    setShowForm(false);
  };

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    setAccounts(
      accounts.map((acc) => ({
        ...acc,
        isPrimary: acc.id === id,
      }))
    );
  };

  const handleComplete = () => {
    if (accounts.length > 0) {
      onComplete(accounts);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-[#222222] bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-tight">Sentinel Banking</span>
          </div>
          <button
            onClick={onSkip}
            className="text-[#888888] hover:text-white transition-colors text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded border border-[#222222] bg-[#050505] mb-4">
            <CreditCard className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
            Link Your Bank Accounts
          </h2>
          <p className="text-sm text-[#888888]">
            Add your bank accounts to enable instant money transfers
          </p>
          <button
            onClick={() => {
              const demoAccount: BankAccount = {
                id: `BANK-DEMO-${Date.now()}`,
                accountNumber: '1234567890',
                accountHolderName: 'Demo User',
                ifscCode: 'HDFC0001234',
                bankName: 'HDFC Bank',
                accountType: 'savings',
                isPrimary: accounts.length === 0,
              };
              setAccounts([...accounts, demoAccount]);
            }}
            className="mt-4 px-4 py-2 bg-[#222222] border border-[#333333] rounded text-xs text-[#EDEDED] hover:bg-[#333333] transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Demo Account
          </button>
        </motion.div>

        {/* Added Accounts */}
        {accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-4"
          >
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-[#222222] bg-[#050505] p-6 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-white" strokeWidth={1.5} />
                      <h3 className="text-sm font-medium text-[#EDEDED]">{account.bankName}</h3>
                      {account.isPrimary && (
                        <span className="px-2 py-0.5 bg-white text-black text-xs rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
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
                        <p className="text-sm text-[#EDEDED] capitalize">{account.accountType}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!account.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(account.id)}
                        className="text-xs text-[#888888] hover:text-white transition-colors"
                      >
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveAccount(account.id)}
                      className="text-[#888888] hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add Account Form */}
        <AnimatePresence>
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-[#222222] bg-[#050505] p-8 rounded mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-[#EDEDED]">Add Bank Account</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-[#888888] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs mb-2 text-[#888888]">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="HDFC Bank, ICICI Bank, etc."
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs mb-2 text-[#888888]">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) =>
                        setFormData({ ...formData, accountHolderName: e.target.value })
                      }
                      placeholder="As per bank records"
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-2 text-[#888888]">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, accountNumber: e.target.value })
                      }
                      placeholder="Enter account number"
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-2 text-[#888888]">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.confirmAccountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmAccountNumber: e.target.value })
                      }
                      placeholder="Re-enter account number"
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-2 text-[#888888]">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="HDFC0001234"
                      maxLength={11}
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs mb-2 text-[#888888]">Account Type</label>
                    <select
                      value={formData.accountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountType: e.target.value as 'savings' | 'current',
                        })
                      }
                      className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                    >
                      <option value="savings">Savings</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Add Account
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowForm(true)}
              className="w-full border border-[#222222] bg-[#050505] p-6 rounded text-sm hover:border-white transition-colors flex items-center justify-center gap-2 text-[#888888] hover:text-white mb-6"
            >
              <Plus className="w-4 h-4" />
              Add Bank Account
            </motion.button>
          )}
        </AnimatePresence>

        {/* Complete Button */}
        {accounts.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleComplete}
            className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
          >
            Continue to Dashboard
          </motion.button>
        )}

        {accounts.length === 0 && (
          <div className="border border-[#222222] bg-[#050505] p-6 rounded text-center">
            <p className="text-xs text-[#888888]">
              You can add bank accounts later from your profile settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

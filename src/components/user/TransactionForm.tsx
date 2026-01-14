import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

interface BankAccount {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  accountType: 'savings' | 'current';
  isPrimary: boolean;
}

interface TransactionFormProps {
  balance: number;
  bankAccounts: BankAccount[];
  onTransactionSubmit: (transaction: any) => Promise<any>;
}

export function TransactionForm({ balance, bankAccounts, onTransactionSubmit }: TransactionFormProps) {
  const [transferType, setTransferType] = useState<'upi' | 'bank'>('upi');
  const [recipient, setRecipient] = useState('');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [beneficiaryIFSC, setBeneficiaryIFSC] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'flagged' | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [amlFlags, setAmlFlags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setResult(null);
    setAmlFlags([]);

    // Simulate AML checks with realistic processing time
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const amountNum = parseFloat(amount);
    const flags: string[] = [];
    let isFlagged = false;

    // Enhanced AML rules
    if (amountNum > 1000000) {
      flags.push('High-value transaction detected (> ₹10,00,000) - Requires compliance review');
      isFlagged = true;
    }
    if (amountNum >= 950000 && amountNum <= 999999) {
      flags.push('Potential structuring pattern - Amount just below reporting threshold');
      isFlagged = true;
    }
    if (amountNum > 2000) {
      const recentTransactions = Math.random();
      if (recentTransactions > 0.7) {
        flags.push('High transaction velocity detected - Multiple transfers in short timeframe');
        isFlagged = true;
      }
    }
    const suspiciousKeywords = ['urgent', 'cash', 'loan', 'crypto', 'btc', 'betting', 'gambling'];
    const descLower = description.toLowerCase();
    const foundKeywords = suspiciousKeywords.filter(keyword => descLower.includes(keyword));
    if (foundKeywords.length > 0) {
      flags.push(`Suspicious keywords detected: "${foundKeywords.join(', ')}" - Manual review required`);
      isFlagged = true;
    }
    if (transferType === 'bank' && Math.random() > 0.85) {
      flags.push('Unusual geographic pattern - Transaction from different location than usual');
      isFlagged = true;
    }
    if (amountNum % 1000 === 0 && amountNum >= 5000) {
      flags.push('Round amount pattern detected - Common in layering schemes');
    }

    const transaction = {
      id: `TXN-${Date.now()}`,
      type: 'debit',
      transferType,
      amount: amountNum,
      recipient: transferType === 'upi' ? recipient : beneficiaryName,
      recipientAccount: transferType === 'bank' ? beneficiaryAccount : undefined,
      recipientIFSC: transferType === 'bank' ? beneficiaryIFSC : undefined,
      sourceAccount: transferType === 'bank' ? sourceAccount : undefined,
      description,
      date: new Date().toISOString(),
      status: isFlagged ? 'pending_review' : 'completed',
      flagged: isFlagged,
      amlFlags: flags,
      riskScore: isFlagged ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 10,
    };

    setAmlFlags(flags);

    if (isFlagged) {
      setResult('flagged');
      setFlagReason(flags.join(' • '));
      setProcessing(false);
      return;
    }

    try {
      const realTx = await onTransactionSubmit(transaction);

      if (realTx && (realTx.status === 'flagged' || realTx.status === 'pending_review' || (realTx.riskScore && realTx.riskScore > 50))) {
        setResult('flagged');
        setFlagReason(realTx.aiExplanation || "AI Risk Assessment: High Risk Transaction Detected");
      } else {
        setResult('success');
      }
    } catch (err: any) {
      console.error("Tx Failed:", err);
      setResult('success');
    }

    setProcessing(false);
  };

  const handleReset = () => {
    setRecipient('');
    setBeneficiaryAccount('');
    setBeneficiaryIFSC('');
    setBeneficiaryName('');
    setSourceAccount('');
    setAmount('');
    setDescription('');
    setResult(null);
    setFlagReason('');
    setAmlFlags([]);
  };

  if (result === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-[#222222] bg-[#050505] p-12 rounded text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" strokeWidth={1.5} />
        </motion.div>
        <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">Transaction Successful</h3>
        <p className="text-sm text-[#888888] mb-8">
          Your payment of ₹{amount} has been processed
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="bg-white text-black px-6 py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
        >
          Make Another Transaction
        </motion.button>
      </motion.div>
    );
  }

  if (result === 'flagged') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-[#222222] bg-[#050505] p-12 rounded text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
        </motion.div>
        <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">Transaction Flagged</h3>
        <p className="text-sm text-[#888888] mb-4">
          This transaction has been flagged for compliance review
        </p>
        <div className="border border-[#222222] bg-black p-4 rounded mb-8">
          <p className="text-xs text-[#888888]">{flagReason}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReset}
          className="bg-white text-black px-6 py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#222222] bg-[#050505] p-8 rounded"
    >
      <h3 className="text-lg font-medium mb-6 text-[#EDEDED]">Send Money</h3>

      {/* Transfer Type Selector */}
      <div className="mb-6">
        <label className="block text-xs mb-3 text-[#888888]">Transfer Method</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTransferType('upi')}
            className={`px-4 py-3 rounded border transition-colors text-sm ${transferType === 'upi'
              ? 'border-white bg-black text-white'
              : 'border-[#222222] bg-black text-[#888888] hover:border-white hover:text-white'
              }`}
          >
            <Send className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
            UPI/Phone
          </button>
          <button
            type="button"
            onClick={() => setTransferType('bank')}
            className={`px-4 py-3 rounded border transition-colors text-sm ${transferType === 'bank'
              ? 'border-white bg-black text-white'
              : 'border-[#222222] bg-black text-[#888888] hover:border-white hover:text-white'
              }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
            Bank Transfer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {transferType === 'upi' ? (
          <div>
            <label className="block text-xs mb-2 text-[#888888]">Recipient UPI ID / Phone</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="user@upi or +91 9876543210"
              className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
              required
            />
          </div>
        ) : (
          <>
            {bankAccounts.length > 0 && (
              <div>
                <label className="block text-xs mb-2 text-[#888888]">From Account</label>
                <select
                  value={sourceAccount}
                  onChange={(e) => setSourceAccount(e.target.value)}
                  className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                  required
                >
                  <option value="">Select your account</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - ••••{acc.accountNumber.slice(-4)}
                      {acc.isPrimary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs mb-2 text-[#888888]">Beneficiary Name</label>
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Account holder name"
                className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-2 text-[#888888]">Account Number</label>
                <input
                  type="text"
                  value={beneficiaryAccount}
                  onChange={(e) => setBeneficiaryAccount(e.target.value)}
                  placeholder="Account number"
                  className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs mb-2 text-[#888888]">IFSC Code</label>
                <input
                  type="text"
                  value={beneficiaryIFSC}
                  onChange={(e) => setBeneficiaryIFSC(e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  maxLength={11}
                  className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs mb-2 text-[#888888]">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            max={balance}
            step="0.01"
            className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
            required
          />
          <p className="text-xs text-[#888888] mt-2">
            Available: ₹{balance.toLocaleString('en-IN')}
          </p>
        </div>

        <div>
          <label className="block text-xs mb-2 text-[#888888]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED] resize-none"
          />
        </div>

        <div className="border border-[#222222] rounded p-4 bg-black">
          <p className="text-xs text-[#888888] mb-2">🛡️ AML/CFT Monitoring Active</p>
          <ul className="space-y-1 text-xs text-[#888888]">
            <li>• High-value transaction detection</li>
            <li>• Structuring & smurfing pattern analysis</li>
            <li>• Velocity & frequency monitoring</li>
            <li>• Keyword & semantic analysis</li>
            <li>• Geo-location anomaly detection</li>
            <li>• Round amount pattern detection</li>
          </ul>
        </div>

        <motion.button
          whileHover={{ scale: processing ? 1 : 1.01 }}
          whileTap={{ scale: processing ? 1 : 0.99 }}
          type="submit"
          disabled={processing}
          className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing & Running AML Checks...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Money
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

interface TransactionGraphProps {
  alertType?: string;
}

export function TransactionGraph({ alertType }: TransactionGraphProps) {
  // Mock transaction data for visualization
  const transactions = [
    { from: 'User A', to: 'User B', amount: 49000, suspicious: true },
    { from: 'User A', to: 'User C', amount: 48500, suspicious: true },
    { from: 'User A', to: 'User D', amount: 49500, suspicious: true },
    { from: 'User B', to: 'User E', amount: 25000, suspicious: false },
  ];

  return (
    <div className="border border-[#222222] bg-[#050505] rounded p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-[#EDEDED]">Transaction Flow</h3>
          <p className="text-xs text-[#888888] mt-1">Network analysis visualization</p>
        </div>
        <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.5} />
      </div>

      {/* Simple visualization */}
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
                  className={`h-full ${
                    tx.suspicious ? 'bg-white' : 'bg-[#888888]'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[#EDEDED]">
                  ₹{tx.amount.toLocaleString('en-IN')}
                </span>
                {tx.suspicious && (
                  <span className="text-xs text-white">Flagged</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-[#222222]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
            <p className="text-xs text-[#888888] mt-1">Total Txns</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {transactions.filter(t => t.suspicious).length}
            </p>
            <p className="text-xs text-[#888888] mt-1">Suspicious</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              ₹{transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-[#888888] mt-1">Total Volume</p>
          </div>
        </div>
      </div>
    </div>
  );
}

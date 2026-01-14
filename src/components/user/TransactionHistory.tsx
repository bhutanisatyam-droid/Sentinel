import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  recipient: string;
  date: string;
  status: 'completed' | 'pending' | 'pending_review';
  flagged?: boolean;
  flagReason?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
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

  if (transactions.length === 0) {
    return (
      <div className="border border-[#222222] bg-[#050505] p-12 rounded text-center">
        <Clock className="w-16 h-16 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
        <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">No Transactions Yet</h3>
        <p className="text-sm text-[#888888]">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="border border-[#222222] bg-[#050505] rounded">
      <div className="p-6 border-b border-[#222222]">
        <h3 className="text-lg font-medium text-[#EDEDED]">Transaction History</h3>
        <p className="text-xs text-[#888888] mt-1">All your transactions in one place</p>
      </div>

      <div className="divide-y divide-[#222222]">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-6 hover:bg-black transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full border border-[#222222] flex items-center justify-center ${
                    transaction.type === 'credit' ? 'bg-black' : 'bg-[#050505]'
                  }`}
                >
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft className="w-5 h-5 text-white" strokeWidth={1.5} />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={1.5} />
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#EDEDED]">
                    {transaction.type === 'credit' ? 'Received from' : 'Sent to'} {transaction.recipient}
                  </p>
                  <p className="text-xs text-[#888888] mt-1">{formatDate(transaction.date)}</p>
                  {transaction.flagged && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-3 h-3 text-[#888888]" strokeWidth={1.5} />
                      <p className="text-xs text-[#888888]">Flagged for review</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-medium ${
                    transaction.type === 'credit' ? 'text-white' : 'text-[#EDEDED]'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}₹
                  {transaction.amount.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {transaction.status === 'completed' && (
                    <>
                      <CheckCircle className="w-3 h-3 text-white" strokeWidth={1.5} />
                      <span className="text-xs text-white">Completed</span>
                    </>
                  )}
                  {transaction.status === 'pending_review' && (
                    <>
                      <Clock className="w-3 h-3 text-[#888888]" strokeWidth={1.5} />
                      <span className="text-xs text-[#888888]">Under Review</span>
                    </>
                  )}
                  {transaction.status === 'pending' && (
                    <>
                      <Clock className="w-3 h-3 text-[#888888]" strokeWidth={1.5} />
                      <span className="text-xs text-[#888888]">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {transaction.flagReason && (
              <div className="mt-4 p-3 border border-[#222222] rounded bg-black">
                <p className="text-xs text-[#888888]">{transaction.flagReason}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

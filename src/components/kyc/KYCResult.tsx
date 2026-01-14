import { motion } from 'motion/react';
import { CheckCircle, Shield, Sparkles } from 'lucide-react';

interface KYCResultProps {
  onComplete: () => void;
}

export function KYCResult({ onComplete }: KYCResultProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-[#222222] rounded p-12 bg-[#050505] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative inline-block mb-6"
        >
          <div className="w-24 h-24 rounded-full border border-[#222222] bg-black flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full border border-[#222222] bg-black flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]"
        >
          Verification Complete
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[#888888] mb-8"
        >
          Your identity has been successfully verified
        </motion.p>

        {/* Verification Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-[#222222] rounded p-6 mb-8 text-left"
        >
          <h3 className="text-xs font-medium mb-4 text-[#888888]">Verification Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888888]">Document Verification</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white">Passed</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888888]">Liveness Check</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white">Passed</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#888888]">Watchlist Screening</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                <span className="text-white">Clear</span>
              </div>
            </div>
            <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-sm">
              <span className="text-[#888888]">Risk Score</span>
              <span className="text-white font-medium">12/100 (Low)</span>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors"
        >
          Continue to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}

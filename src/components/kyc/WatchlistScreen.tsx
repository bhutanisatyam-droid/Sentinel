import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface WatchlistScreenProps {
  onComplete: () => void;
}

export function WatchlistScreen({ onComplete }: WatchlistScreenProps) {
  const [screening, setScreening] = useState(true);
  const [results, setResults] = useState<{ list: string; status: 'clear' | 'match' }[]>([]);

  useEffect(() => {
    // Simulate watchlist screening
    const watchlists = [
      { list: 'UN Sanctions List', status: 'clear' as const },
      { list: 'OFAC SDN List', status: 'clear' as const },
      { list: 'EU Financial Sanctions', status: 'clear' as const },
      { list: 'UAPA (India)', status: 'clear' as const },
      { list: 'PEP Database', status: 'clear' as const },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < watchlists.length) {
        setResults(prev => [...prev, watchlists[currentIndex]]);
        currentIndex++;
      } else {
        setScreening(false);
        setTimeout(() => {
          onComplete();
        }, 2000);
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
          Watchlist Screening
        </h2>
        <p className="text-sm text-[#888888]">
          Checking against global sanctions and PEP databases
        </p>
      </motion.div>

      <div className="border border-[#222222] rounded p-8 bg-[#050505]">
        <div className="space-y-4">
          {results.filter(Boolean).map((result, index) => (
            <motion.div
              key={result.list}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 border border-[#222222] rounded bg-black"
            >
              <div className="flex items-center gap-3">
                {result?.status === 'clear' ? (
                  <CheckCircle className="w-5 h-5 text-white" strokeWidth={1.5} />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#888888]" strokeWidth={1.5} />
                )}
                <span className="text-sm text-[#EDEDED]">{result.list}</span>
              </div>
              <span className="text-xs text-[#888888]">
                {result?.status === 'clear' ? 'No Match' : 'Match Found'}
              </span>
            </motion.div>
          ))}

          {screening && results.length < 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center p-4 border border-[#222222] border-dashed rounded"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-[#222222] border-t-white rounded-full"
              />
              <span className="ml-3 text-sm text-[#888888]">Screening in progress...</span>
            </motion.div>
          )}
        </div>

        {!screening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 border border-[#222222] rounded bg-black text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2 
              }}
              className="inline-flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ 
                  duration: 0.6,
                  times: [0, 0.6, 1],
                  delay: 0.2
                }}
                className="relative"
              >
                {/* Animated green circle background */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                  >
                    <CheckCircle 
                      className="w-10 h-10 text-green-500" 
                      strokeWidth={2.5} 
                      fill="transparent"
                    />
                  </motion.div>
                </motion.div>
                
                {/* Expanding ring effect */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute inset-0 rounded-full border-2 border-green-500"
                />
              </motion.div>
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-sm font-medium mb-1 text-[#EDEDED] mt-4"
            >
              All Clear
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-[#888888]"
            >
              No matches found in watchlist databases
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
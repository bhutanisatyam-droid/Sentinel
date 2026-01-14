import { motion } from 'motion/react';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export function RiskAnalytics() {
  const riskDistribution = [
    { category: 'Low Risk', count: 1180, percentage: 95, color: 'bg-[#888888]' },
    { category: 'Medium Risk', count: 52, percentage: 4, color: 'bg-[#EDEDED]' },
    { category: 'High Risk', count: 15, percentage: 1, color: 'bg-white' },
  ];

  const topRiskPatterns = [
    { pattern: 'Structuring', incidents: 12, trend: '+15%' },
    { pattern: 'Geo-Velocity', incidents: 8, trend: '+22%' },
    { pattern: 'Dormant Wake-Up', incidents: 6, trend: '-5%' },
    { pattern: 'Profile Mismatch', incidents: 4, trend: '+8%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Risk Distribution */}
      <div className="border border-[#222222] bg-[#050505] rounded p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-[#EDEDED]">Risk Distribution</h3>
            <p className="text-xs text-[#888888] mt-1">User base segmentation</p>
          </div>
          <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>

        <div className="space-y-4">
          {riskDistribution.map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#EDEDED]">{item.category}</span>
                <span className="text-xs text-[#888888]">
                  {item.count} users ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-black rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#888888]">Total Users</span>
            <span className="text-sm font-medium text-[#EDEDED]">1,247</span>
          </div>
        </div>
      </div>

      {/* Top Risk Patterns */}
      <div className="border border-[#222222] bg-[#050505] rounded p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-[#EDEDED]">Top Risk Patterns</h3>
            <p className="text-xs text-[#888888] mt-1">Last 30 days</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>

        <div className="space-y-4">
          {topRiskPatterns.map((pattern, index) => (
            <motion.div
              key={pattern.pattern}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 border border-[#222222] rounded bg-black"
            >
              <div>
                <p className="text-sm text-[#EDEDED] mb-1">{pattern.pattern}</p>
                <p className="text-xs text-[#888888]">{pattern.incidents} incidents</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={`w-4 h-4 ${
                    pattern.trend.startsWith('+') ? 'text-white' : 'text-[#888888]'
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`text-xs ${
                    pattern.trend.startsWith('+') ? 'text-white' : 'text-[#888888]'
                  }`}
                >
                  {pattern.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

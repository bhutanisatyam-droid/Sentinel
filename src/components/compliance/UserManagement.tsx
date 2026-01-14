import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Shield, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  phone: string;
  kycStatus: 'verified' | 'pending' | 'rejected';
  riskScore: number;
  accountAge: string;
  lastActivity: string;
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  const users: User[] = [
    {
      id: 'USR-1234',
      name: 'Rahul Kumar',
      phone: '+91 9876543210',
      kycStatus: 'verified',
      riskScore: 15,
      accountAge: '47 days',
      lastActivity: '2 hours ago',
    },
    {
      id: 'USR-5678',
      name: 'Priya Singh',
      phone: '+91 9876543211',
      kycStatus: 'verified',
      riskScore: 87,
      accountAge: '23 days',
      lastActivity: '5 minutes ago',
    },
    {
      id: 'USR-9012',
      name: 'Raj Patel',
      phone: '+91 9876543212',
      kycStatus: 'verified',
      riskScore: 78,
      accountAge: '156 days',
      lastActivity: '1 day ago',
    },
    {
      id: 'USR-3456',
      name: 'Anita Desai',
      phone: '+91 9876543213',
      kycStatus: 'pending',
      riskScore: 35,
      accountAge: '3 days',
      lastActivity: '12 hours ago',
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery)
  );

  return (
    <div className="border border-[#222222] bg-[#050505] rounded">
      <div className="p-6 border-b border-[#222222]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-[#EDEDED]">User Management</h3>
            <p className="text-xs text-[#888888] mt-1">
              Monitor and manage verified users
            </p>
          </div>
          <Users className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, or phone..."
            className="w-full bg-black border border-[#222222] rounded pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#222222]">
            <tr className="text-left">
              <th className="px-6 py-4 text-xs text-[#888888]">User ID</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Name</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Phone</th>
              <th className="px-6 py-4 text-xs text-[#888888]">KYC Status</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Risk Score</th>
              <th className="px-6 py-4 text-xs text-[#888888]">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {filteredUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-black transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-[#EDEDED]">{user.id}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[#EDEDED]">{user.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[#888888]">{user.phone}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.kycStatus === 'verified' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-white" strokeWidth={1.5} />
                        <span className="text-xs text-white">Verified</span>
                      </>
                    ) : user.kycStatus === 'pending' ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                        <span className="text-xs text-[#888888]">Pending</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#888888]" strokeWidth={1.5} />
                        <span className="text-xs text-[#888888]">Rejected</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user.riskScore >= 70
                          ? 'bg-white'
                          : user.riskScore >= 40
                          ? 'bg-[#888888]'
                          : 'bg-[#444444]'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        user.riskScore >= 70
                          ? 'text-white'
                          : user.riskScore >= 40
                          ? 'text-[#EDEDED]'
                          : 'text-[#888888]'
                      }`}
                    >
                      {user.riskScore}/100
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-[#888888]">{user.lastActivity}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
          <p className="text-sm text-[#888888]">No users found matching your search</p>
        </div>
      )}
    </div>
  );
}

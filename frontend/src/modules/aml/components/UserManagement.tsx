import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, AlertTriangle, CheckCircle, Users, Loader2 } from 'lucide-react';
import { apiClient as api } from '@/shared/lib/api-client';

interface User {
    id: string;
    name: string;
    phone: string;
    kycStatus: 'verified' | 'pending' | 'rejected';
    riskScore: number;
    kycLocation?: string;
    accountAge: string;
    lastActivity: string;
}

function mapUser(raw: any): User {
    // Calculate relative time for last activity
    let lastActivity = 'Unknown';
    if (raw.updated_at || raw.created_at) {
        const ts = new Date(raw.updated_at || raw.created_at);
        const diff = Date.now() - ts.getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) lastActivity = 'Just now';
        else if (hours < 24) lastActivity = `${hours} hours ago`;
        else lastActivity = `${Math.floor(hours / 24)} days ago`;
    }

    // Calculate account age
    let accountAge = 'Unknown';
    if (raw.created_at) {
        const days = Math.floor((Date.now() - new Date(raw.created_at).getTime()) / 86400000);
        accountAge = days < 1 ? 'Today' : `${days} days`;
    }

    return {
        id: raw.id || '',
        name: raw.full_name || raw.email || 'Unknown',
        phone: raw.phone || raw.mobile || 'â€”',
        kycStatus: (raw.kyc_status || 'pending').toLowerCase() as User['kycStatus'],
        riskScore: raw.risk_score ?? 0,
        kycLocation: raw.kyc_location || raw.location || undefined,
        accountAge,
        lastActivity,
    };
}

export function UserManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.listUsers({ per_page: 50 }).then((res) => {
            const mapped = (res.data || []).map(mapUser);
            setUsers(mapped);
            setLoading(false);
        });
    }, []);

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
                            {loading ? 'Loading...' : `${users.length} users from Supabase`}
                        </p>
                    </div>
                    <Users className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>

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

            {loading ? (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#888888]" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-[#222222]">
                            <tr className="text-left">
                                <th className="px-6 py-4 text-xs text-[#888888]">User ID</th>
                                <th className="px-6 py-4 text-xs text-[#888888]">Name</th>
                                <th className="px-6 py-4 text-xs text-[#888888]">Phone</th>
                                <th className="px-6 py-4 text-xs text-[#888888]">KYC Status</th>
                                <th className="px-6 py-4 text-xs text-[#888888]">Risk Score</th>
                                <th className="px-6 py-4 text-xs text-[#888888]">KYC Location</th>
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
                                        <span className="text-xs font-mono text-[#EDEDED]">{user.id.slice(0, 12)}</span>
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
                                                className={`w-2 h-2 rounded-full ${user.riskScore >= 70
                                                        ? 'bg-white'
                                                        : user.riskScore >= 40
                                                            ? 'bg-[#888888]'
                                                            : 'bg-[#444444]'
                                                    }`}
                                            />
                                            <span
                                                className={`text-sm ${user.riskScore >= 70
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
                                        <span className="text-xs text-[#888888]">{user.kycLocation || 'Unknown'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-[#888888]">{user.lastActivity}</span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-[#888888]" strokeWidth={1.5} />
                    <p className="text-sm text-[#888888]">No users found matching your search</p>
                </div>
            )}
        </div>
    );
}


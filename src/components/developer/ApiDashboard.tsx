
import { motion } from 'motion/react';
import { Shield, LogOut, Code, ArrowLeft } from 'lucide-react';

interface ApiDashboardProps {
    onLogout: () => void;
    onBack: () => void;
}

export function ApiDashboard({ onLogout, onBack }: ApiDashboardProps) {
    return (
        <div className="min-h-screen bg-black text-white pb-12">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 border-b border-[#222222] bg-black bg-opacity-80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
                        <span className="text-sm font-medium tracking-tight">Sentinel Developer</span>
                    </div>
                    <div className="flex items-center gap-4">

                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 text-[#888888] hover:text-white transition-colors text-sm"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={1.5} />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="pt-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-[#222222] bg-[#050505] p-8 rounded"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-[#EDEDED] mb-1">Developer API Keys</h3>
                                <p className="text-xs text-[#888888]">Manage your API keys for integration</p>
                            </div>
                            <button className="px-4 py-2 bg-white text-black text-xs rounded hover:bg-[#EDEDED] transition-colors">
                                Generate New Key
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 border border-[#222222] rounded bg-black">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[#888888]">Live Secret Key</span>
                                    <span className="text-xs text-green-500 bg-green-900/20 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <code className="text-sm font-mono text-[#EDEDED] bg-[#111] px-3 py-2 rounded flex-1">
                                        sk_live_51M.....................Xy9z
                                    </code>
                                    <button className="text-xs text-[#888888] hover:text-white">Copy</button>
                                </div>
                            </div>

                            <div className="p-4 border border-[#222222] rounded bg-black">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-[#888888]">Test Secret Key</span>
                                    <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-0.5 rounded">Active</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <code className="text-sm font-mono text-[#EDEDED] bg-[#111] px-3 py-2 rounded flex-1">
                                        sk_test_48N.....................Ab2k
                                    </code>
                                    <button className="text-xs text-[#888888] hover:text-white">Copy</button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#222222]">
                                <h4 className="text-sm font-medium text-[#EDEDED] mb-3">Quick Start</h4>
                                <div className="p-4 bg-[#111] rounded border border-[#222222]">
                                    <code className="text-xs font-mono text-[#888888]">
                                        <span className="text-purple-400">curl</span> https://api.sentinel.dev/v1/kyc/verify \<br />
                                        &nbsp;&nbsp;-u <span className="text-blue-400">sk_test_48N...</span>: \<br />
                                        &nbsp;&nbsp;-d <span className="text-green-400">image</span>=@selfie.jpg
                                    </code>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

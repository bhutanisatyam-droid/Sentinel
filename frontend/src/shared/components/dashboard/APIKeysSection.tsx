"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Key,
    Eye,
    EyeOff,
    Copy,
    Check,
    Plus,
    RotateCw,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { SpotlightCard } from "@/shared/components/SpotlightCard";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface APIKey {
    id: string;
    name: string;
    prefix: string;
    key: string;
    environment: "production" | "sandbox";
    created: string;
    lastUsed: string;
    status: "active" | "revoked";
}

// ————————————————————————————————————————————————————————————————————————————————
const mockKeys: APIKey[] = [
    {
        id: "1",
        name: "Production — Main App",
        prefix: "sk_live",
        key: "sk_live_placeholder_key_sentinel_prod_12345",
        environment: "production",
        created: "2026-01-15",
        lastUsed: "2 minutes ago",
        status: "active",
    },
    {
        id: "2",
        name: "Sandbox — Testing",
        prefix: "sk_test",
        key: "sk_test_placeholder_key_sentinel_sandbox_12345",
        environment: "sandbox",
        created: "2026-01-10",
        lastUsed: "1 hour ago",
        status: "active",
    },
    {
        id: "3",
        name: "Production â€” Mobile SDK",
        prefix: "pk_live",
        key: "pk_live_9aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV",
        environment: "production",
        created: "2026-02-01",
        lastUsed: "5 minutes ago",
        status: "active",
    },
];

// â”€â”€â”€ CopyButton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CopyKeyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
                 text-white/50 hover:text-white/80 transition-all duration-200 cursor-pointer"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-sentinel-green" />
                    <span className="text-sentinel-green">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}

// â”€â”€â”€ Single Key Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function APIKeyRow({ apiKey }: { apiKey: APIKey }) {
    const [revealed, setRevealed] = useState(false);

    const maskedKey = `${apiKey.prefix}_${"â€¢".repeat(32)}`;

    return (
        <SpotlightCard
            className="mb-3"
            spotlightColor={
                apiKey.environment === "production"
                    ? "rgba(0, 255, 136, 0.04)"
                    : "rgba(0, 212, 255, 0.04)"
            }
            borderColor={
                apiKey.environment === "production"
                    ? "rgba(0, 255, 136, 0.15)"
                    : "rgba(0, 212, 255, 0.15)"
            }
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${apiKey.environment === "production"
                                    ? "bg-sentinel-green/10"
                                    : "bg-sentinel-blue/10"
                                }`}
                        >
                            <Key
                                className={`w-5 h-5 ${apiKey.environment === "production"
                                        ? "text-sentinel-green"
                                        : "text-sentinel-blue"
                                    }`}
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-white/90">
                                {apiKey.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span
                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${apiKey.environment === "production"
                                            ? "bg-sentinel-green/10 text-sentinel-green"
                                            : "bg-sentinel-blue/10 text-sentinel-blue"
                                        }`}
                                >
                                    {apiKey.environment}
                                </span>
                                <span className="text-xs text-white/20">
                                    Created {apiKey.created}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setRevealed(!revealed)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-white/30 hover:text-white/60 hover:bg-white/[0.04]
                         transition-colors cursor-pointer"
                            title={revealed ? "Hide key" : "Reveal key"}
                        >
                            {revealed ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-white/20 hover:text-sentinel-amber hover:bg-sentinel-amber/5
                         transition-colors cursor-pointer"
                            title="Rotate key"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                            className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-white/20 hover:text-sentinel-red hover:bg-sentinel-red/5
                         transition-colors cursor-pointer"
                            title="Revoke key"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Key display */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/[0.04]">
                    <code className="flex-1 text-sm font-mono text-white/50 overflow-hidden text-ellipsis whitespace-nowrap">
                        {revealed ? apiKey.key : maskedKey}
                    </code>
                    <CopyKeyButton text={apiKey.key} />
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-white/20">
                        Last used: {apiKey.lastUsed}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-sentinel-green animate-pulse" />
                        <span className="text-xs text-sentinel-green/60">Active</span>
                    </div>
                </div>
            </div>
        </SpotlightCard>
    );
}

// â”€â”€â”€ Main API Keys Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function APIKeysSection() {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Live API Keys</h2>
                    <p className="text-sm text-white/30 mt-1">
                        Manage your API keys for production and sandbox environments
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-sentinel-blue to-[#0088cc]
                     text-black font-semibold text-sm
                     hover:shadow-lg hover:shadow-sentinel-blue/20
                     transition-shadow cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Create New Key
                </motion.button>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sentinel-amber/5 border border-sentinel-amber/10 mb-6">
                <AlertTriangle className="w-5 h-5 text-sentinel-amber shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-sentinel-amber">
                        Keep your API keys secure
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                        Never expose secret keys in client-side code. Use environment
                        variables and server-side requests only.
                    </p>
                </div>
            </div>

            {/* Keys list */}
            <div>
                {mockKeys.map((key, i) => (
                    <motion.div
                        key={key.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                    >
                        <APIKeyRow apiKey={key} />
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                    {
                        label: "Total Requests Today",
                        value: "12,847",
                        change: "+14.2%",
                        color: "text-sentinel-green",
                    },
                    {
                        label: "Avg. Latency",
                        value: "184ms",
                        change: "-8.1%",
                        color: "text-sentinel-green",
                    },
                    {
                        label: "Error Rate",
                        value: "0.03%",
                        change: "+0.01%",
                        color: "text-sentinel-red",
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="p-5 rounded-xl bg-[#0A0A0A] border border-white/[0.06]"
                    >
                        <p className="text-xs text-white/30 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                            <span className={`text-xs font-medium ${stat.color}`}>
                                {stat.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}


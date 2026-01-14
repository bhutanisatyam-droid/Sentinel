import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function BackgroundWrapper({ children }: { children: ReactNode }) {
    return (
        <div className="relative min-h-screen w-full bg-[#020617] overflow-x-hidden selection:bg-cyan-500/30">
            {/* 1. Base Gradient Layer (Deep Void) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(17,24,39,1)_0%,_rgba(2,6,23,1)_100%)]" />
            </div>

            {/* 2. Unified PCB Mesh (The "True Board") */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
                <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <linearGradient id="trace-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                        </linearGradient>

                        {/* The PCB Pattern Unit */}
                        <pattern id="pcb-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                            {/* Horizontal & Vertical Highways */}
                            <path d="M0 20 H200 M0 40 H200 M0 160 H200 M0 180 H200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            <path d="M20 0 V200 M40 0 V200 M160 0 V200 M180 0 V200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                            {/* Diagonal Traces */}
                            <path d="M40 40 L60 60 H140 L160 40" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />
                            <path d="M40 160 L60 140 H140 L160 160" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none" />

                            {/* Chipset Squares */}
                            <rect x="70" y="70" width="60" height="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                            <rect x="80" y="80" width="40" height="40" fill="rgba(6,182,212,0.03)" />

                            {/* Connection Nodes */}
                            <circle cx="60" cy="60" r="2" fill="rgba(255,255,255,0.2)" />
                            <circle cx="140" cy="60" r="2" fill="rgba(255,255,255,0.2)" />
                            <circle cx="60" cy="140" r="2" fill="rgba(255,255,255,0.2)" />
                            <circle cx="140" cy="140" r="2" fill="rgba(255,255,255,0.2)" />
                        </pattern>
                    </defs>

                    {/* Full Screen PCB Mesh with Center Mask */}
                    <rect width="100%" height="100%" fill="url(#pcb-pattern)" mask="url(#center-mask)" />

                    {/* Mask Definition */}
                    <mask id="center-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx="720" cy="450" r="400" fill="black" filter="url(#blur-mask)" />
                    </mask>
                    <filter id="blur-mask">
                        <feGaussianBlur stdDeviation="80" />
                    </filter>

                    {/* Active Data Flows (Global) */}
                    <path d="M0 100 H1440" stroke="url(#trace-gradient)" strokeWidth="2" opacity="0.3">
                        <animate attributeName="d" values="M0 100 H1440; M0 120 H1440; M0 100 H1440" dur="10s" repeatCount="indefinite" />
                    </path>
                    <path d="M0 800 H1440" stroke="url(#trace-gradient)" strokeWidth="2" opacity="0.3">
                        <animate attributeName="d" values="M0 800 H1440; M0 780 H1440; M0 800 H1440" dur="15s" repeatCount="indefinite" />
                    </path>
                </svg>
            </div>

            {/* 3. Global Ambient Glow (Subtle) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-900/20 rounded-full blur-[120px] mix-blend-screen"
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}

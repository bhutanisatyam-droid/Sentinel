"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MagneticButton } from "@/shared/components/MagneticButton";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// â”€â”€â”€ Spotlight Card Wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SpotlightCardWrapper({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        };
        card.addEventListener("mousemove", handleMouseMove);
        return () => card.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div ref={cardRef} className={`spotlight-card ${className}`}>
            {children}
        </div>
    );
}

// â”€â”€â”€ Hero Code Block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeroCodeBlock() {
    return (
        <div className="w-full max-w-3xl relative group code-glow-container mb-4">
            <div className="code-terminal-highlight relative bg-[#0d1117] rounded-xl border border-sentinel-surface-border overflow-hidden shadow-2xl z-10">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-sentinel-surface-border">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                    </div>
                    <span className="ml-2 text-xs text-sentinel-text-dim font-[family-name:var(--font-geist-mono)]">verify-user.ts</span>
                </div>
                {/* Code content */}
                <div className="p-6 text-left overflow-x-auto code-scroll">
                    <pre className="font-[family-name:var(--font-geist-mono)] text-sm leading-relaxed whitespace-pre">
                        <span className="text-pink-400">import</span>
                        <span className="text-white/60">{" { Sentinel } "}</span>
                        <span className="text-pink-400">from</span>
                        <span className="text-green-300">{" '@sentinel/sdk'"}</span>
                        <span className="text-white/60">;</span>
                        {"\n"}
                        <span className="text-pink-400">const</span>
                        <span className="text-white/60"> client = </span>
                        <span className="text-pink-400">new</span>
                        <span className="text-purple-300"> Sentinel</span>
                        <span className="text-white/60">(process.env.SENTINEL_API_KEY);</span>
                        {"\n"}
                        <span className="text-slate-400">{"// Real-time AML check"}</span>
                        {"\n"}
                        <span className="text-pink-400">const</span>
                        <span className="text-white/60"> verification = </span>
                        <span className="text-pink-400">await</span>
                        <span className="text-white/60"> client.kyc.</span>
                        <span className="text-blue-400">verify</span>
                        <span className="text-white/60">({"{"}</span>
                        {"\n"}
                        <span className="text-white/60">{"  userId: "}</span>
                        <span className="text-green-300">{"'user_123'"}</span>
                        <span className="text-white/60">,</span>
                        {"\n"}
                        <span className="text-white/60">{"  document: "}</span>
                        <span className="text-green-300">{"'passport_scan_b64'"}</span>
                        <span className="text-white/60">,</span>
                        {"\n"}
                        <span className="text-white/60">{"  checkType: ["}</span>
                        <span className="text-green-300">{"'sanctions'"}</span>
                        <span className="text-white/60">, </span>
                        <span className="text-green-300">{"'pep'"}</span>
                        <span className="text-white/60">, </span>
                        <span className="text-green-300">{"'adverse_media'"}</span>
                        <span className="text-white/60">]</span>
                        {"\n"}
                        <span className="text-white/60">{"})"}</span>
                        <span className="text-white/60">;</span>
                        {"\n"}
                        <span className="text-pink-400">if</span>
                        <span className="text-white/60"> (verification.riskScore {">"} </span>
                        <span className="text-orange-300">0.85</span>
                        <span className="text-white/60">) {"{"}</span>
                        {"\n"}
                        <span className="text-white/60">{"  "}</span>
                        <span className="text-pink-400">await</span>
                        <span className="text-white/60"> client.cases.</span>
                        <span className="text-blue-400">create</span>
                        <span className="text-white/60">({"{ "}priority: </span>
                        <span className="text-green-300">{"'high'"}</span>
                        <span className="text-white/60">, reason: </span>
                        <span className="text-green-300">{"'AML Flag'"}</span>
                        <span className="text-white/60">{" }"});</span>
                        {"\n"}
                        <span className="text-white/60">{"}"}</span>
                    </pre>
                </div>
            </div>
        </div>
    );
}

// â”€â”€â”€ Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function HeroSection() {
    return (
        <section className="relative pt-16 pb-0 px-4 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-[radial-gradient(circle_at_center,_rgba(41,119,255,0.15)_0%,_rgba(0,0,0,0)_70%)] blur-[100px] opacity-20 pointer-events-none" />

            <div className="max-w-4xl mx-auto flex flex-col items-center text-center z-10 relative">
                {/* Hero title */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="hero-title-scroll mt-8 text-4xl md:text-6xl lg:text-[64px] font-bold leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
                >
                    Compliance intelligence <br className="hidden md:block" /> for developers
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="text-lg md:text-xl text-sentinel-text-dim max-w-2xl mb-10 leading-relaxed"
                >
                    Sentinel provides a developer-first compliance intelligence API. Detect fraud, automate KYC, and monitor
                    transactions in real-time with a single integration.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16"
                >
                    <Link
                        href="/dashboard"
                        className="btn-metallic btn-metallic-pulse group relative px-8 py-3.5 rounded-lg overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-2"
                        id="cta-get-started"
                    >
                        <span className="relative z-10 font-semibold flex items-center gap-2 group-hover:text-black transition-colors text-sm">
                            Get started free
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>

                    <a
                        href="#"
                        className="btn-metallic px-8 py-3.5 rounded-lg text-sentinel-text-dim font-medium hover:text-black transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 text-sm"
                    >
                        <BookOpen className="w-4 h-4" />
                        Read the docs
                    </a>
                </motion.div>

                {/* Code Block */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full flex justify-center"
                >
                    <HeroCodeBlock />
                </motion.div>
            </div>
        </section>
    );
}

// â”€â”€â”€ Three Pillars Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function FeaturesSection() {
    return (
        <section className="py-24 px-4 bg-black overflow-hidden" id="features">
            <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <div className="inline-block px-3 py-1 rounded-full bg-sentinel-primary/10 border border-sentinel-primary/20 text-sentinel-primary text-xs font-bold mb-5 font-[family-name:var(--font-geist-mono)] tracking-widest uppercase">
                        Core Technology
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Three Pillars of Sentinel
                    </h2>
                    <p className="text-sentinel-text-dim max-w-2xl mx-auto text-lg">
                        Our core technologies provide comprehensive coverage across the compliance spectrum.
                    </p>
                </motion.div>

                {/* Asymmetric Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                    {/* Pillar 1: Regulatory Rules â€” Tall card spanning 2 rows */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <SpotlightCardWrapper className="group rounded-2xl border border-sentinel-surface-border hover:border-blue-500/40 transition-all duration-500 lg:row-span-2 relative overflow-hidden">
                            <div className="spotlight-card-content p-8 md:p-10 h-full flex flex-col justify-between min-h-[320px] lg:min-h-[500px]">
                                {/* Top section */}
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
                                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
                                            </svg>
                                        </div>
                                        <span className="text-[10px] font-[family-name:var(--font-geist-mono)] font-bold tracking-widest uppercase text-blue-400/70 bg-blue-500/5 px-2.5 py-1 rounded-full border border-blue-500/10">
                                            Engine v3.2
                                        </span>
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-white tracking-tight">
                                        Regulatory Rules
                                    </h3>
                                    <p className="text-sentinel-text-dim text-sm lg:text-base leading-relaxed">
                                        Automated rule sets for global compliance across 140+ jurisdictions. Updated weekly to ensure zero-lag adherence to new mandates and regulatory changes.
                                    </p>
                                </div>

                                {/* Bottom stats */}
                                <div className="mt-8 pt-6 border-t border-sentinel-surface-border/50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-2xl font-bold text-white font-[family-name:var(--font-geist-mono)]">140+</div>
                                            <div className="text-[11px] text-sentinel-text-dim uppercase tracking-wider mt-1">Jurisdictions</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-white font-[family-name:var(--font-geist-mono)]">Weekly</div>
                                            <div className="text-[11px] text-sentinel-text-dim uppercase tracking-wider mt-1">Rule Updates</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </SpotlightCardWrapper>
                    </motion.div>

                    {/* Pillar 2: ML Anomaly Detection */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <SpotlightCardWrapper className="group rounded-2xl border border-sentinel-surface-border hover:border-purple-500/40 transition-all duration-500 relative overflow-hidden">
                            <div className="spotlight-card-content p-8 md:p-10 h-full flex flex-col min-h-[280px]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-500">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-[family-name:var(--font-geist-mono)] font-bold tracking-widest uppercase text-purple-400/70 bg-purple-500/5 px-2.5 py-1 rounded-full border border-purple-500/10">
                                        AI-Powered
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">
                                    ML Anomaly Detection
                                </h3>
                                <p className="text-sentinel-text-dim text-sm leading-relaxed flex-1">
                                    Self-learning models that detect suspicious patterns and emerging fraud vectors in real-time before they impact your business.
                                </p>
                                {/* Live indicator */}
                                <div className="mt-6 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
                                    <span className="text-xs text-sentinel-text-dim font-[family-name:var(--font-geist-mono)]">Models training in real-time</span>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </SpotlightCardWrapper>
                    </motion.div>

                    {/* Pillar 3: Graph Intelligence */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <SpotlightCardWrapper className="group rounded-2xl border border-sentinel-surface-border hover:border-green-500/40 transition-all duration-500 relative overflow-hidden">
                            <div className="spotlight-card-content p-8 md:p-10 h-full flex flex-col min-h-[280px]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-500">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-[family-name:var(--font-geist-mono)] font-bold tracking-widest uppercase text-green-400/70 bg-green-500/5 px-2.5 py-1 rounded-full border border-green-500/10">
                                        Graph DB
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white tracking-tight">
                                    Graph Intelligence
                                </h3>
                                <p className="text-sentinel-text-dim text-sm leading-relaxed flex-1">
                                    Advanced graph databases to track money flows through multiple hops, identifying laundering rings and hidden syndicates.
                                </p>
                                {/* Mini graph visualization */}
                                <div className="mt-6 flex items-center gap-4">
                                    <svg className="w-16 h-10 text-green-500/40" viewBox="0 0 64 40" fill="none">
                                        <circle cx="10" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <circle cx="32" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <circle cx="54" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <circle cx="32" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                        <line x1="14" y1="18" x2="27" y2="12" stroke="currentColor" strokeWidth="1" />
                                        <line x1="37" y1="12" x2="50" y2="18" stroke="currentColor" strokeWidth="1" />
                                        <line x1="32" y1="15" x2="32" y2="28" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                                        <line x1="14" y1="22" x2="28" y2="30" stroke="currentColor" strokeWidth="1" />
                                    </svg>
                                    <div>
                                        <div className="text-lg font-bold text-white font-[family-name:var(--font-geist-mono)]">2.4B+</div>
                                        <div className="text-[10px] text-sentinel-text-dim uppercase tracking-wider">Nodes Analyzed</div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative glow */}
                            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-green-500/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </SpotlightCardWrapper>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// â”€â”€â”€ Built for your Stack Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BuiltForStackSection() {
    return (
        <section id="api" className="py-24 px-4 border-t border-sentinel-surface-border bg-gradient-to-b from-sentinel-surface to-black">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                {/* Left copy */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex-1"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for your stack</h2>
                    <p className="text-sentinel-text-dim mb-8 text-lg">
                        Integrate robust compliance checks in minutes, not months. Our SDKs are type-safe and fully documented.
                    </p>
                    <ul className="space-y-4">
                        {[
                            "99.99% API Uptime SLA",
                            "Global Sanction Lists (OFAC, EU, UN)",
                            "Sub-50ms Latency",
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-10">
                        <a
                            href="#"
                            className="text-sentinel-primary font-semibold hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            View API Reference
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </motion.div>

                {/* Right â€” SDK Code */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="flex-1 w-full max-w-2xl"
                >
                    <div className="code-glow-container relative">
                        <div className="code-terminal-highlight bg-[#0d1117] border border-sentinel-surface-border rounded-xl overflow-hidden shadow-2xl relative z-10">
                            {/* Tabs */}
                            <div className="flex border-b border-sentinel-surface-border bg-[#161b22]">
                                <button className="px-6 py-3 text-sm font-medium text-white border-b-2 border-sentinel-primary bg-[#0d1117]">Node.js</button>
                                <button className="px-6 py-3 text-sm font-medium text-sentinel-text-dim hover:text-white transition-colors">Python</button>
                                <button className="px-6 py-3 text-sm font-medium text-sentinel-text-dim hover:text-white transition-colors">cURL</button>
                            </div>
                            <div className="p-6 overflow-x-auto code-scroll">
                                <pre className="font-[family-name:var(--font-geist-mono)] text-sm whitespace-pre">
                                    <span className="text-slate-400">{"// Install: npm install @sentinel/sdk"}</span>
                                    {"\n"}
                                    <span className="text-pink-400">const</span>
                                    <span className="text-white/60"> sentinel = </span>
                                    <span className="text-pink-400">require</span>
                                    <span className="text-white/60">(</span>
                                    <span className="text-green-300">{"'sentinel-node'"}</span>
                                    <span className="text-white/60">);</span>
                                    {"\n"}
                                    <span className="text-pink-400">const</span>
                                    <span className="text-white/60"> monitorTransaction = </span>
                                    <span className="text-pink-400">async</span>
                                    <span className="text-white/60"> (txn) =&gt; {"{"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"  "}</span>
                                    <span className="text-pink-400">try</span>
                                    <span className="text-white/60"> {"{"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"    "}</span>
                                    <span className="text-pink-400">const</span>
                                    <span className="text-white/60"> result = </span>
                                    <span className="text-pink-400">await</span>
                                    <span className="text-white/60"> sentinel.transactions.</span>
                                    <span className="text-blue-400">scan</span>
                                    <span className="text-white/60">({"{"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"      amount: txn.amount,"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"      currency: txn.currency,"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"      sender: txn.senderId,"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"      receiver: txn.receiverId,"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"      metadata: { device_id: txn.deviceId }"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"    }"});</span>
                                    {"\n"}
                                    <span className="text-white/60">{"    "}</span>
                                    <span className="text-pink-400">return</span>
                                    <span className="text-white/60"> result.status; </span>
                                    <span className="text-slate-400">{"// 'CLEARED' | 'FLAGGED'"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"  }"} </span>
                                    <span className="text-pink-400">catch</span>
                                    <span className="text-white/60"> (error) {"{"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"    console."}</span>
                                    <span className="text-blue-400">error</span>
                                    <span className="text-white/60">(</span>
                                    <span className="text-green-300">{"'Compliance check failed'"}</span>
                                    <span className="text-white/60">, error);</span>
                                    {"\n"}
                                    <span className="text-white/60">{"  }"}</span>
                                    {"\n"}
                                    <span className="text-white/60">{"};"}</span>
                                </pre>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// â”€â”€â”€ Network Effect / Graph Visualization Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function NetworkEffectSection() {
    return (
        <section className="py-24 px-4 nodal-bg">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left â€” SVG Graph Visualization */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="order-2 lg:order-1 relative rounded-xl border border-sentinel-surface-border bg-sentinel-surface p-6 overflow-hidden h-[400px] flex items-center justify-center group code-glow-container"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sentinel-surface via-sentinel-surface to-black opacity-80 z-10" />
                    <svg className="relative z-20 w-full h-full" fill="none" viewBox="0 0 400 300">
                        <path d="M100 150 L200 100" stroke="#334155" strokeWidth="1" />
                        <path d="M200 100 L300 150" stroke="#334155" strokeWidth="1" />
                        <path d="M200 100 L200 200" stroke="#334155" strokeWidth="1" />
                        <path d="M100 150 L200 200" stroke="#ef4444" strokeDasharray="4 4" strokeWidth="2" />
                        <circle cx="100" cy="150" fill="#1e293b" r="20" stroke="#334155" strokeWidth="2" />
                        <text fill="#64748b" fontFamily="monospace" fontSize="10" textAnchor="middle" x="100" y="154">A1</text>
                        <circle className="animate-pulse" cx="200" cy="100" fill="#1e293b" r="30" stroke="#3b82f6" strokeWidth="2" />
                        <text fill="#94a3b8" fontFamily="monospace" fontSize="12" textAnchor="middle" x="200" y="104">HUB</text>
                        <circle cx="300" cy="150" fill="#1e293b" r="20" stroke="#22c55e" strokeWidth="2" />
                        <text fill="#4ade80" fontFamily="monospace" fontSize="10" textAnchor="middle" x="300" y="154">SAFE</text>
                        <circle cx="200" cy="200" fill="#1e293b" r="25" stroke="#ef4444" strokeWidth="2" />
                        <text fill="#f87171" fontFamily="monospace" fontSize="10" textAnchor="middle" x="200" y="204">RISK</text>
                        <rect fill="#7f1d1d" height="24" rx="4" width="80" x="230" y="180" />
                        <text fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle" x="270" y="196">LAUNDERING</text>
                    </svg>
                </motion.div>

                {/* Right â€” Copy */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="order-1 lg:order-2"
                >
                    <div className="inline-block px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-4 font-[family-name:var(--font-geist-mono)]">
                        LIVE MONITORING
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">See the network effect</h2>
                    <p className="text-sentinel-text-dim text-lg mb-6">
                        Fraudsters don&apos;t work alone. Our Graph Intelligence engine visualizes hidden connections between
                        accounts, devices, and identities to spot money laundering rings instantly.
                    </p>
                    <div className="flex gap-8">
                        <div>
                            <div className="text-2xl font-bold text-white mb-1 font-[family-name:var(--font-geist-mono)]">2.4B+</div>
                            <div className="text-xs text-sentinel-text-dim uppercase tracking-wider">Nodes Analyzed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white mb-1 font-[family-name:var(--font-geist-mono)]">140ms</div>
                            <div className="text-xs text-sentinel-text-dim uppercase tracking-wider">Graph Query Time</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// â”€â”€â”€ Pricing Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const pricingTiers = [
    {
        name: "Starter",
        price: "$0",
        description: "Perfect for side projects and prototypes.",
        features: ["1,000 checks/mo", "Basic AML Rules", "Email Support"],
        cta: "Start Building",
        popular: false,
        hoverClass: "hover:scale-105 hover:shadow-orchid-glow hover:border-[#E6E6FA]",
    },
    {
        name: "Pro",
        price: "$0",
        description: "For scaling fintechs needing full coverage.",
        features: ["50,000 checks/mo", "Advanced Graph Intel", "Priority Support", "Audit Logs Export"],
        cta: "Get Started",
        popular: true,
        hoverClass: "hover:scale-105 hover:shadow-blood-glow",
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Volume discounts and dedicated infrastructure.",
        features: ["Unlimited checks", "Custom Rule Sets", "Dedicated Success Manager", "On-premise deployment"],
        cta: "Contact Sales",
        popular: false,
        hoverClass: "hover:scale-105 hover:shadow-orchid-glow hover:border-[#E6E6FA]",
    },
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-10 px-4 bg-black relative">
            <div className="max-w-7xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl font-bold text-center mb-16"
                >
                    Simple, transparent pricing
                </motion.h2>

                <div className="grid md:grid-cols-3 gap-8">
                    {pricingTiers.map((tier, i) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        >
                            <SpotlightCardWrapper
                                className={`p-8 rounded-xl flex flex-col pricing-card ${tier.popular
                                    ? `border-2 border-white relative transform md:-translate-y-4 ${tier.hoverClass}`
                                    : `border border-sentinel-surface-border ${tier.hoverClass}`
                                    }`}
                            >
                                <div className="spotlight-card-content">
                                    {tier.popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-[family-name:var(--font-geist-mono)] z-20">
                                            Most Popular
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                    <div className="text-3xl font-bold mb-6 font-[family-name:var(--font-geist-mono)]">
                                        {tier.price}
                                        {tier.price !== "Custom" && (
                                            <span className="text-lg font-normal text-sentinel-text-dim">/mo</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-sentinel-text-dim mb-8">{tier.description}</p>

                                    <ul className="space-y-4 mb-8 flex-1">
                                        {tier.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className={`flex gap-3 text-sm ${tier.popular ? "text-white" : "text-sentinel-text-dim"
                                                    }`}
                                            >
                                                <span className={tier.popular ? "text-sentinel-primary" : "text-white"}>âœ“</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/dashboard"
                                        className={`w-full py-3 rounded-md font-medium transition-colors text-center block text-sm ${tier.popular
                                            ? "btn-metallic text-white font-bold"
                                            : "border border-sentinel-surface-border text-white btn-metallic"
                                            }`}
                                    >
                                        {tier.cta}
                                    </Link>
                                </div>
                            </SpotlightCardWrapper>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}


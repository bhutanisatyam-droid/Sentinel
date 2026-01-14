import { useRef } from 'react';
import { motion, useScroll } from 'motion/react';
import { Shield, ArrowRight, CheckCircle, Code, Activity } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface LandingPageProps {
  onGetStarted: () => void;
  onGetApiKeys?: () => void;
}

export function LandingPage({ onGetStarted, onGetApiKeys }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className="min-h-screen text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-tight">Sentinel</span>
          </motion.div>

          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-[#888888] hover:text-white transition-colors">
              Features
            </a>
            <a href="#docs" className="text-sm text-[#888888] hover:text-white transition-colors">
              Docs
            </a>
            <a href="#pricing" className="text-sm text-[#888888] hover:text-white transition-colors">
              Pricing
            </a>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onGetStarted}
              className="px-4 py-2 bg-gradient-to-r from-white to-[#E0E0E0] text-black text-sm rounded hover:from-[#F5F5F5] hover:to-[#D0D0D0] transition-all shadow-sm"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative px-8 pt-20">
        <div className="max-w-7xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6 px-3 py-1 rounded-full border border-[#222222] text-xs text-[#888888]"
            >
              Trusted by 500+ Fintech Companies
            </motion.div>

            <h1 className="text-[4.5rem] font-bold tracking-tight leading-[1.1] mb-6 text-[#EDEDED]">
              Compliance for the
              <br />
              Modern Stack
            </h1>

            <p className="text-xl text-[#888888] max-w-2xl mx-auto mb-12 leading-relaxed">
              Ship KYC and AML infrastructure in minutes, not months. Built for developers who need speed without sacrificing security.
            </p>

            <div className="flex gap-4 justify-center mb-20">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGetStarted}
                className="px-6 py-3 bg-gradient-to-br from-white via-[#F5F5F5] to-[#E0E0E0] text-black text-sm rounded flex items-center gap-2 hover:from-[#F5F5F5] hover:via-[#E8E8E8] hover:to-[#D0D0D0] transition-all shadow-lg"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-[#222222] bg-gradient-to-br from-[#0A0A0A] to-[#050505] text-sm rounded hover:border-[#444444] hover:from-[#111111] hover:to-[#0A0A0A] transition-all"
              >
                View Documentation
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-[#888888]">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-[1px] h-12 bg-gradient-to-b from-transparent via-[#888888] to-transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* KYC Section */}
      <section className="min-h-screen flex items-center justify-center px-8 py-32 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-3 py-1 rounded-full border border-[#222222] text-xs text-[#888888] mb-6">
              Identity Verification
            </div>

            <h2 className="text-5xl font-bold tracking-tight mb-6 text-[#EDEDED]">
              Instant ID
              <br />
              Verification
            </h2>

            <p className="text-lg text-[#888888] mb-8 leading-relaxed max-w-3xl">
              Verify government-issued IDs from 200+ countries in under 30 seconds. OCR extraction, biometric liveness, and watchlist screening—all in one API call.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Sub-second ID verification',
                'Flash-based liveness detection',
                'Real-time sanctions screening',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#888888]" strokeWidth={1.5} />
                  <span className="text-sm text-[#888888]">{feature}</span>
                </div>
              ))}
            </div>

            <CodeBlock
              language="javascript"
              code={`const response = await sentinel.kyc.verify({
  idType: 'passport',
  idNumber: 'J1234567',
  selfie: base64Image,
  liveness: true
});

// Returns: { verified: true, riskScore: 12, faceMatch: 94% }`}
            />
          </motion.div>
        </div>
      </section>

      {/* AML Section */}
      <section className="min-h-screen flex items-center justify-center px-8 py-32 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-3 py-1 rounded-full border border-[#222222] text-xs text-[#888888] mb-6">
              Transaction Monitoring
            </div>

            <h2 className="text-5xl font-bold tracking-tight mb-6 text-[#EDEDED]">
              Real-Time Risk
              <br />
              Detection
            </h2>

            <p className="text-lg text-[#888888] mb-8 leading-relaxed max-w-3xl">
              AI-powered AML engine that monitors every transaction. Graph neural networks detect layering, structuring, and circular flows before they become problems.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'Graph-based fraud detection',
                'Explainable AI risk scores',
                'Auto-generate SAR reports',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#888888]" strokeWidth={1.5} />
                  <span className="text-sm text-[#888888]">{feature}</span>
                </div>
              ))}
            </div>

            {/* Risk Chart */}
            <div className="border border-[#222222] rounded p-6 bg-[#050505] max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#888888]">Risk Distribution</span>
                <Activity className="w-4 h-4 text-[#888888]" />
              </div>
              <svg className="w-full h-32" viewBox="0 0 400 100">
                <path
                  d="M 0 80 L 50 75 L 100 60 L 150 65 L 200 45 L 250 50 L 300 30 L 350 35 L 400 20"
                  fill="none"
                  stroke="#EDEDED"
                  strokeWidth="1.5"
                />
                <path
                  d="M 0 80 L 50 75 L 100 60 L 150 65 L 200 45 L 250 50 L 300 30 L 350 35 L 400 20 L 400 100 L 0 100 Z"
                  fill="url(#gradient)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EDEDED" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EDEDED" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="mt-4 flex justify-between text-xs text-[#888888]">
                <span>Jan</span>
                <span>Dec</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-32 px-8 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-[#EDEDED]">
              Ship in Minutes
            </h2>
            <p className="text-lg text-[#888888]">
              One API. Infinite possibilities.
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-6">
            {[
              {
                title: 'REST API',
                description: 'RESTful endpoints for all operations',
                code: 'POST /v1/kyc/verify',
              },
              {
                title: 'Webhooks',
                description: 'Real-time event notifications',
                code: 'kyc.verified',
              },
              {
                title: 'SDKs',
                description: 'Native libraries for every language',
                code: 'npm install @sentinel/node',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-black border border-[#222222] rounded p-6 hover:border-[#444444] transition-colors"
              >
                <Code className="w-6 h-6 text-[#888888] mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-medium mb-2 text-[#EDEDED]">{item.title}</h3>
                <p className="text-sm text-[#888888] mb-4">{item.description}</p>
                <code className="text-xs text-[#888888] bg-[#050505] px-2 py-1 rounded">
                  {item.code}
                </code>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 border-t border-[#222222]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-6 text-[#EDEDED]">
              Ready to Ship Compliance?
            </h2>
            <p className="text-lg text-[#888888] mb-8">
              Start building with our developer-friendly APIs today
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetApiKeys || onGetStarted}
              className="px-8 py-4 bg-gradient-to-br from-white via-[#F5F5F5] to-[#E0E0E0] text-black rounded hover:from-[#F5F5F5] hover:via-[#E8E8E8] hover:to-[#D0D0D0] transition-all shadow-lg inline-flex items-center gap-2"
            >
              Get API Keys
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#222222] py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
                <span className="text-sm font-medium">Sentinel</span>
              </div>
              <p className="text-xs text-[#888888] leading-relaxed">
                Modern compliance infrastructure for the next generation of fintech.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 text-[#EDEDED]">Product</h4>
              <ul className="space-y-2 text-xs text-[#888888]">
                <li><a href="#" className="hover:text-white transition-colors">KYC Verification</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AML Monitoring</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Watchlist Screening</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 text-[#EDEDED]">Developers</h4>
              <ul className="space-y-2 text-xs text-[#888888]">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SDKs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4 text-[#EDEDED]">Company</h4>
              <ul className="space-y-2 text-xs text-[#888888]">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs text-[#888888]">
              <span>&copy; 2025 Sentinel</span>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-[#888888]">System Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

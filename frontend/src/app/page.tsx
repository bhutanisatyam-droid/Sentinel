"use client";

import {
  HeroSection,
  FeaturesSection,
  BuiltForStackSection,
  NetworkEffectSection,
  PricingSection,
} from "@/landing/components/LandingSections";
import { motion } from "framer-motion";
import Link from "next/link";
import { Fingerprint } from "lucide-react";
import { useState, useEffect } from "react";

// â”€â”€â”€ Navbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Navbar() {

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-sentinel-surface-border bg-black/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-sentinel-cherenkov">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
            </svg>
          </div>
          <span className="text-white font-bold tracking-tight text-lg">
            Sentinel
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-sentinel-text-dim">
          {["Features", "API", "Pricing", "Docs", "Blog"].map((item) => {
            const hrefMap: Record<string, string> = {
              "Features": "#features",
              "API": "#api",
              "Pricing": "#pricing"
            };
            return (
              <a
                key={item}
                href={hrefMap[item] || "#"}
                className="hover:text-white transition-colors"
              >
                {item}
              </a>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:block text-sm font-medium text-sentinel-text-dim hover:text-white transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/kyc"
            className="btn-metallic text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Fingerprint className="w-4 h-4" />
            Product Demo
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// â”€â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Footer() {
  return (
    <footer className="border-t border-sentinel-surface-border bg-black pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
                </svg>
              </div>
              <span className="text-white font-bold">Sentinel</span>
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Product",
              links: ["Features", "Integrations", "Pricing", "Changelog"],
            },
            {
              title: "Developers",
              links: ["Documentation", "API Reference", "Status", "Github"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy", "Terms", "Security"],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-white font-bold mb-4">{group.title}</h4>
              <ul className="space-y-2 text-sm text-sentinel-text-dim">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-sentinel-surface-border">
          <p className="text-sentinel-text-dim text-xs mb-4 md:mb-0">
            Â© 2026 Sentinel Inc. All rights reserved.
          </p>
          <p className="text-sentinel-text-dim text-xs italic">
            Built with obsessive attention to compliance. And coffee.
          </p>
        </div>
      </div>
    </footer>
  );
}

// â”€â”€â”€ Landing Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <BuiltForStackSection />
        <NetworkEffectSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}


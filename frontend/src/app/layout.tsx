import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { ServiceWorkerRegistration } from "@/shared/components/ServiceWorkerRegistration";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sentinel â€” Developer Compliance API",
  description:
    "Sentinel provides a developer-first compliance intelligence API. Detect fraud, automate KYC, and monitor transactions in real-time with a single integration.",
  keywords: [
    "compliance API",
    "fraud detection",
    "KYC API",
    "AML screening",
    "identity verification",
    "fintech compliance",
    "developer API",
    "anti money laundering",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sentinel",
  },
  openGraph: {
    title: "Sentinel â€” Developer Compliance API",
    description:
      "Developer-first compliance intelligence API. Detect fraud, automate KYC, and monitor transactions in real-time.",
    type: "website",
    siteName: "Sentinel",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-black text-foreground selection:bg-[rgba(41,119,255,0.3)] overflow-x-hidden`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}


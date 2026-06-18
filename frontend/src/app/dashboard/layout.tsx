'use client';

import { Sidebar } from '@/shared/components/dashboard/sidebar';
import { TopBar } from '@/shared/components/dashboard/top-bar';
import { AICopilotTerminal } from '@/shared/components/AICopilotTerminal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#060606]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto ml-12">
        <TopBar />
        <div className="p-5 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* AI Copilot (preserved from original layout) */}
      <AICopilotTerminal />
    </div>
  );
}


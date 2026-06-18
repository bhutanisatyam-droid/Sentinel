'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/dashboard':           'Overview',
  '/dashboard/alerts':    'Alert Queue',
  '/dashboard/money-map': 'Money Map',
  '/dashboard/users':     'Users',
  '/dashboard/reports':   'Reports',
  '/dashboard/audit':     'Audit Log',
  '/dashboard/settings':  'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-12 flex items-center justify-between px-6 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#161616]">
      <span className="text-[13px] font-medium text-[#888]">{title}</span>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-md px-2.5 py-1.5 w-52">
          <Search className="w-3 h-3 text-[#444]" />
          <input
            type="text"
            placeholder="Search…"
            className="bg-transparent text-[12px] text-[#999] placeholder:text-[#333] outline-none w-full"
          />
          <kbd className="hidden sm:inline text-[9px] text-[#333] bg-[#0A0A0A] px-1 py-0.5 rounded border border-[#1a1a1a] font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button className="relative p-1 rounded-md hover:bg-[#111] transition-colors cursor-pointer">
          <Bell className="w-3.5 h-3.5 text-[#555]" />
          <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-[#FF1744]" />
        </button>

        {/* Avatar */}
        <div className="w-6 h-6 rounded-md bg-[#161616] flex items-center justify-center">
          <span className="text-[9px] font-semibold text-[#555]">CO</span>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { supabase } from '@/shared/lib/supabase.client';
import {
  LayoutDashboard,
  AlertTriangle,
  Network,
  Users,
  FileText,
  ScrollText,
  Settings,
  Menu,
  X,
} from 'lucide-react';

/* â”€â”€â”€ Context so layout can read sidebar width â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SidebarContext = createContext({ expanded: false });
export const useSidebar = () => useContext(SidebarContext);

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Overview',    href: '/dashboard' },
  { icon: AlertTriangle,   label: 'Alert Queue',  href: '/dashboard/alerts' },
  { icon: Network,         label: 'Money Map',    href: '/dashboard/money-map' },
  { icon: Users,           label: 'Users',        href: '/dashboard/users' },
];

const complianceNav: NavItem[] = [
  { icon: FileText,   label: 'Reports',   href: '/dashboard/reports' },
  { icon: ScrollText, label: 'Audit Log', href: '/dashboard/audit' },
];

const systemNav: NavItem[] = [
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{name: string, role: string} | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch actual role from our backend /me endpoint using the real token
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/me`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserProfile({ name: data.full_name || session.user.email?.split('@')[0], role: data.role });
          } else {
             const rawName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Unknown';
             setUserProfile({ name: rawName, role: 'Officer' });
          }
        } catch {
             const rawName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Unknown';
             setUserProfile({ name: rawName, role: 'Officer' });
        }
      }
    };
    fetchUser();
  }, []);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <SidebarContext.Provider value={{ expanded }}>
      {/* Overlay when expanded on mobile-like feel */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[#0A0A0A] border-r border-[#161616] transition-all duration-200',
          expanded ? 'w-52' : 'w-12',
        )}
      >
        {/* Toggle button */}
        <div className={cn('flex items-center px-3 h-12 shrink-0', expanded ? 'justify-between' : 'justify-center')}>
          {expanded && (
            <span className="text-[13px] font-semibold text-[#e0e0e0] tracking-tight flex items-center gap-2">
              Sentinel
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md hover:bg-[#161616] transition-colors cursor-pointer"
          >
            {expanded ? (
              <X className="w-4 h-4 text-[#555]" />
            ) : (
              <Menu className="w-4 h-4 text-[#555]" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2 space-y-0.5">
          <NavSection label="Main" items={mainNav} isActive={isActive} expanded={expanded} />
          <div className="h-px bg-[#161616] my-2 mx-1" />
          <NavSection label="Compliance" items={complianceNav} isActive={isActive} expanded={expanded} />
          <div className="h-px bg-[#161616] my-2 mx-1" />
          <NavSection label="System" items={systemNav} isActive={isActive} expanded={expanded} />
        </nav>

        {/* Footer */}
        {expanded && (
          <div className="px-3 py-3 border-t border-[#161616]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#161616] flex items-center justify-center shrink-0">
                <span className="text-[9px] font-semibold text-[#555] uppercase">
                  {userProfile?.name?.substring(0, 2) || 'CO'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium text-[#e0e0e0] truncate leading-tight">
                  {userProfile?.name || 'Loading...'}
                </span>
                <span className="text-[10px] text-[#888] truncate uppercase tracking-wider">
                  {userProfile?.role?.replace('COMPLIANCE_', '') || ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </SidebarContext.Provider>
  );
}

function NavSection({ label, items, isActive, expanded }: {
  label: string;
  items: NavItem[];
  isActive: (h: string) => boolean;
  expanded: boolean;
}) {
  return (
    <>
      {expanded && (
        <p className="px-2 pb-1 text-[9px] uppercase tracking-[0.1em] text-[#333] font-medium">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(item.href)} expanded={expanded} />
      ))}
    </>
  );
}

function NavLink({ item, active, expanded }: { item: NavItem; active: boolean; expanded: boolean }) {
  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={cn(
        'flex items-center rounded-md transition-colors',
        expanded ? 'gap-2.5 py-[7px] px-2.5 text-[13px]' : 'justify-center py-2 px-0',
        active
          ? 'text-[#e0e0e0] bg-[#161616]'
          : 'text-[#555] hover:text-[#888] hover:bg-[#111]',
      )}
    >
      <item.icon className="w-[15px] h-[15px] shrink-0" />
      {expanded && <span>{item.label}</span>}
    </Link>
  );
}


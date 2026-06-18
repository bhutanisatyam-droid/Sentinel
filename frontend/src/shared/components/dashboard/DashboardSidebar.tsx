"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Key,
    FileText,
    Activity,
    Settings,
    Shield,
    Bell,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Search,
    ExternalLink,
    ShieldCheck,
    ShieldAlert,
    UserCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { supabase } from "@/shared/lib/supabase.client";
import { useRouter } from "next/navigation";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: string;
    active?: boolean;
}

// â”€â”€â”€ Navigation Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const primaryNav: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
    { icon: Key, label: "API Keys", href: "/dashboard/keys" },
    { icon: FileText, label: "Documentation", href: "/dashboard/docs" },
    { icon: Activity, label: "Usage & Logs", href: "/dashboard/logs", badge: "Live" },
];

const secondaryNav: NavItem[] = [
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    { icon: Bell, label: "Notifications", href: "/dashboard/notifications", badge: "3" },
];

// â”€â”€â”€ Sidebar Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function DashboardSidebar({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string>("Loading...");
    const [userEmail, setUserEmail] = useState<string>("");
    
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUserRole(session.user.user_metadata?.role || "CUSTOMER");
                setUserEmail(session.user.email || "user@sentinel.com");
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const getRoleStyling = (role: string) => {
        switch (role) {
            case "ADMIN":
                return { color: "from-red-500 to-orange-500", icon: ShieldAlert, label: "System Admin" };
            case "COMPLIANCE_OFFICER":
                return { color: "from-purple-500 to-indigo-500", icon: ShieldCheck, label: "Compliance Officer" };
            case "COMPLIANCE_ANALYST":
                return { color: "from-blue-500 to-cyan-500", icon: Shield, label: "Compliance Analyst" };
            default:
                return { color: "from-gray-500 to-slate-500", icon: UserCircle, label: role };
        }
    };

    const roleStyle = getRoleStyling(userRole);

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 260 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col
                 bg-black border-r border-white/[0.06]"
        >
            {/* Logo area */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sentinel-blue to-[#0088cc] flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-black" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <span className="text-sm font-bold text-white tracking-tight">
                                Sentinel
                            </span>
                            <span className="text-sm font-bold text-sentinel-blue tracking-tight">
                                KYC
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Search (expanded only) */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pt-4 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                            <Search className="w-4 h-4 text-white/20" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent text-sm text-white/60 placeholder:text-white/20 outline-none w-full"
                            />
                            <kbd className="text-[10px] text-white/15 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.06]">
                                âŒ˜K
                            </kbd>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Primary Navigation */}
            <nav className="flex-1 px-3 pt-4 space-y-1">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-3 pb-2 text-[10px] uppercase tracking-widest text-white/20 font-medium"
                        >
                            Platform
                        </motion.p>
                    )}
                </AnimatePresence>
                {primaryNav.map((item) => (
                    <SidebarItem key={item.label} item={item} collapsed={collapsed} />
                ))}

                <div className="h-px bg-white/[0.04] my-4 mx-2" />

                <AnimatePresence>
                    {!collapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-3 pb-2 text-[10px] uppercase tracking-widest text-white/20 font-medium"
                        >
                            System
                        </motion.p>
                    )}
                </AnimatePresence>
                {secondaryNav.map((item) => (
                    <SidebarItem key={item.label} item={item} collapsed={collapsed} />
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="px-3 py-3 border-t border-white/[0.04]">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     text-white/30 hover:text-white/60 hover:bg-white/[0.03]
                     transition-colors text-sm cursor-pointer"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <>
                            <ChevronLeft className="w-4 h-4" />
                            <span>Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {/* User area */}
            <div className="px-3 pb-4">
                <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] ${collapsed ? "justify-center" : ""
                        }`}
                >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleStyle.color} shrink-0 flex items-center justify-center`}>
                        <roleStyle.icon className="w-4 h-4 text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
                            >
                                <p className="text-sm font-bold text-white/90 truncate flex items-center gap-1">
                                    {roleStyle.label}
                                </p>
                                <p className="text-xs text-white/40 truncate">
                                    {userEmail}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleLogout}
                                className="text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
}

// â”€â”€â”€ Sidebar Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SidebarItem({
    item,
    collapsed,
}: {
    item: NavItem;
    collapsed: boolean;
}) {
    return (
        <Link
            href={item.href}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${item.active
                    ? "bg-sentinel-blue/5 text-sentinel-blue"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }
                  ${collapsed ? "justify-center" : ""}`}
        >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <AnimatePresence>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium overflow-hidden whitespace-nowrap flex-1"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>
            {item.badge && !collapsed && (
                <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badge === "Live"
                        ? "bg-sentinel-green/10 text-sentinel-green"
                        : "bg-sentinel-red/10 text-sentinel-red"
                        }`}
                >
                    {item.badge}
                </motion.span>
            )}
        </Link>
    );
}


"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase.client";

const UserDashboard = dynamic(
    () => import("@/modules/aml/components/UserDashboard").then((mod) => mod.UserDashboard),
    { ssr: false }
);

export default function AMLUserPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Fetch profile data from 'profiles' table
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", session.user.id)
                    .single();
                
                // Determine risk basis: KYC if new user (no transactions), transactions if existing
                const { count: txCount } = await supabase
                    .from("transactions")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", session.user.id);
                    
                setUser({
                    id: session.user.id,
                    name: profile?.full_name || session.user.email?.split('@')[0] || "User",
                    email: session.user.email || "",
                    balance: parseFloat(profile?.balance || 0) || 0,
                    riskScore: profile?.risk_score ?? null,
                    kycStatus: profile?.kyc_status || "PENDING",
                    createdAt: profile?.created_at || session.user.created_at,
                    isDemo: false,
                    riskBasis: (txCount && txCount > 0) ? 'transactions' : 'kyc',
                });
            } else {
                // Use mocked demo user if not authenticated (demo mode)
                const demoUserId = localStorage.getItem("sentinel_demo_user") || "a1b2c3d4-0000-4000-8000-000000000001";
                
                // Fetch newly created profile, or use fallback
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', demoUserId).maybeSingle();
                
                // A demo user is one who skipped KYC â€” even if they have a profile row
                const hasCompletedKyc = profile?.kyc_status && !['PENDING', 'NULL', ''].includes(profile.kyc_status);
                const isDemoUser = !profile || !hasCompletedKyc;
                
                setUser({
                    id: demoUserId,
                    name: profile?.full_name || (isDemoUser ? null : "Demo User"),
                    email: profile?.email || (isDemoUser ? null : "demo@sentinel.com"),
                    balance: isDemoUser ? null : (parseFloat(profile?.balance || 0) || 0),
                    riskScore: isDemoUser ? null : (profile?.risk_score ?? null),
                    kycStatus: isDemoUser ? null : (profile?.kyc_status || null),
                    createdAt: isDemoUser ? null : (profile?.created_at || null),
                    isDemo: isDemoUser,
                    riskBasis: isDemoUser ? null : 'kyc',
                });
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (!user) {
        return <div className="bg-black min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="bg-black min-h-screen">
            <UserDashboard
                user={user}
                bankAccounts={[]}
                onLogout={handleLogout}
            />
        </div>
    );
}


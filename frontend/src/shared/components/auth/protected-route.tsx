"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/shared/lib/supabase.client";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in, redirect to login
        router.push("/login");
        return;
      }

      // Fetch role from user_profiles to ensure we have the exact role
      // especially for users seeded directly into the DB without JWT metadata updates
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
        
      console.log("[RBAC DEBUG] fetch profile for uid:", session.user.id);
      console.log("[RBAC DEBUG] data:", profile, "error:", error);
      
      if (error) {
        console.error("Error fetching user profile role:", error);
      }
        
      const role = profile?.role || session.user.user_metadata?.role || "CUSTOMER";
      
      // Enforce strict RBAC: only Admin, Officer, and Analyst can view the compliance dashboard
      const allowedRoles = ["ADMIN", "COMPLIANCE_OFFICER", "COMPLIANCE_ANALYST"];
      if (!allowedRoles.includes(role.toUpperCase())) {
        router.push("/unauthorized");
        return;
      }
      
      setIsAuthorized(true);
    };

    checkAuth();

    // Listen for auth changes (like logging out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          router.push("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}


"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const KYCFlow = dynamic(
    () => import("@/modules/kyc/components/KYCFlow").then((mod) => mod.KYCFlow),
    { ssr: false }
);

export default function KYCPage() {
    const router = useRouter();

    // Mock user for demo purpose
    const mockUser = {
        id: "12345678-1234-1234-1234-123456789012",
        name: "Demo User",
        email: "demo@sentinel.com",
    };

    const handleComplete = async (kycData: any) => {
        // kycData now contains: { panNumber, occupation, geoParams, verificationDetails: { fullName, ...faceMatchDetails } }
        const ocrName = kycData?.verificationDetails?.fullName || kycData?.fullName || kycData?.name || "Demo User";
        const cleanEmail = `${ocrName.replace(/\s/g, '').toLowerCase()}@sentinel.local`;
        
        let targetUserId = `demo_${Date.now()}`;
        
        // 1. Check if the name matches Madhav Nagar
        if (ocrName.toLowerCase().includes("madhav")) {
            // Use the seeded fixed ID for Madhav
            targetUserId = "a1b2c3d4-0000-4000-8000-000000000001";
        } else {
            // 2. Compute Initial Risk Score and insert new user
            try {
                const { supabase } = await import("@/shared/lib/supabase.client");
                let computedRiskScore = 15; // fallback
                try {
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                    const riskRes = await fetch(`${apiBaseUrl}/api/kyc/compute-risk`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            occupation: kycData?.occupation || "Unknown",
                            kyc_risk_tier: "LOW"
                        })
                    });
                    if (riskRes.ok) {
                        const data = await riskRes.json();
                        computedRiskScore = data.risk_score;
                    }
                } catch (err) {
                    console.warn("Failed to compute risk score:", err);
                }

                const { error } = await supabase.from('profiles').insert({
                    id: targetUserId,
                    full_name: ocrName,
                    email: cleanEmail,
                    balance: 0,
                    occupation: kycData?.occupation || "Unknown",
                    kyc_status: 'VERIFIED',
                    kyc_risk_tier: 'LOW',
                    risk_score: computedRiskScore
                });
                if (error) {
                    console.warn("Could not insert demo profile (RLS or duplicate):", error);
                }
            } catch(err) {
                console.warn("Failed to insert profile:", err);
            }
        }
        
        // 3. Finalize KYC: Link documents & location to the final targetUserId
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const lat = kycData?.geoParams?.latitude;
            const lon = kycData?.geoParams?.longitude;
            const faceMatchScore = kycData?.faceMatchScore || kycData?.score || 0;
            await fetch(`${apiBaseUrl}/api/kyc/finalize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    old_user_id: "12345678-1234-1234-1234-123456789012", // The matching valid UUID
                    new_user_id: targetUserId,
                    lat: lat,
                    lon: lon,
                    face_match_score: faceMatchScore
                })
            });
        } catch (err) {
            console.error("Failed to finalize KYC mapping:", err);
        }

        // Store active user id for AMLUserPage
        localStorage.setItem("sentinel_demo_user", targetUserId);

        // Redirect to internal AML user dashboard
        router.push("/aml/user");
    };

    const handleCancel = () => {
        router.push("/");
    };

    return (
        <div className="bg-black min-h-screen">
            <KYCFlow
                user={mockUser}
                onComplete={handleComplete}
                onCancel={handleCancel}
            />
        </div>
    );
}


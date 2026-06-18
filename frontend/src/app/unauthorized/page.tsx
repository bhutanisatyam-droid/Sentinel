import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-sentinel-surface-border bg-sentinel-surface p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Denied</h1>
          <p className="text-sentinel-text-dim text-sm">
            You do not have the required permissions to access the Sentinel Compliance Dashboard. This area is restricted to authorized compliance personnel only.
          </p>
        </div>

        <div className="pt-6 border-t border-sentinel-surface-border">
          <Link 
            href="/kyc" 
            className="w-full btn-metallic flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to User Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

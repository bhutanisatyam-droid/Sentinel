/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — Type-Safe Environment Configuration
 * ═══════════════════════════════════════════════════════════════
 *
 * Implements the "Schizophrenic App" Environment Strategy
 * from SENTINEL_ARCHITECTURE.md §3.
 *
 * Three modes:
 *   1. DEMO MODE  — `NEXT_PUBLIC_DEMO_MODE="true"`
 *      Bypasses live API calls. Injects mock data for UI demos.
 *
 *   2. DEV BYPASS — `LOCAL_DEV_BYPASS="true"` (server-only)
 *      Relaxes auth, CORS, and validation for rapid testing.
 *
 *   3. PRODUCTION — Neither flag set.
 *      Full enterprise lockdown.
 */

// ── Client-safe flags (bundled into browser JS) ──────────────

/** Whether the app is running in demo mode (mock data, no live APIs). */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/** The FastAPI backend URL (exposed to client via NEXT_PUBLIC_). */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

/** Supabase project URL. */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
}

/** Supabase anon key (safe for client-side). */
export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return key;
}

// ── Server-only flags (never bundled into browser JS) ────────

/**
 * Whether dev bypass is active (server-side only).
 * Relaxes JWT auth, CORS, and Zod validation.
 *
 * IMPORTANT: This reads a non-NEXT_PUBLIC_ env var.
 * It will always be `false` on the client.
 */
export function isDevBypass(): boolean {
  if (typeof window !== 'undefined') return false; // Never true on client
  return process.env.LOCAL_DEV_BYPASS === 'true';
}

/**
 * Supabase service_role key (server-side only).
 * NEVER expose this to the client.
 */
export function getSupabaseServiceRoleKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      'getSupabaseServiceRoleKey() must NEVER be called on the client. ' +
      'This is a catastrophic security violation.'
    );
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

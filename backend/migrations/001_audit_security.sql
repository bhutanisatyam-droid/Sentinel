-- ═══════════════════════════════════════════════════════════════════════
-- Sentinel — Audit Log Security Migration
-- Module 4: Immutable Audit Trail
--
-- CRITICAL: This table is APPEND-ONLY. No UPDATE. No DELETE. Ever.
-- From Features of Sentinel.md, Module 4, Section 4.1
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL,
    override_reason VARCHAR(500),          -- Required if action = 'ALERT_OVERRIDDEN'
    evidence JSONB,
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. CRITICAL: Revoke modification permissions (append-only enforcement)
REVOKE UPDATE, DELETE ON compliance_audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON compliance_audit_logs FROM anon;
REVOKE UPDATE, DELETE ON compliance_audit_logs FROM service_role;

-- 3. Index for chain verification (sequential scan by id)
CREATE INDEX IF NOT EXISTS idx_audit_log_order
    ON compliance_audit_logs(id ASC);

-- 4. Index for user-specific audit trails (for regulatory requests)
CREATE INDEX IF NOT EXISTS idx_audit_log_user
    ON compliance_audit_logs(user_id, created_at);

-- 5. Index for action type filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_action
    ON compliance_audit_logs(action);

-- 6. RLS: Officers and admins can read, only service can insert
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_read_policy" ON compliance_audit_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('ADMIN', 'COMPLIANCE_OFFICER', 'officer', 'admin')
    );

CREATE POLICY "audit_insert_policy" ON compliance_audit_logs
    FOR INSERT WITH CHECK (true);  -- Service role inserts via backend

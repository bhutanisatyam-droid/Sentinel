-- Reports table for STR/CTR/Internal investigation reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('STR', 'CTR', 'INTERNAL')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'FILED', 'REJECTED')),
    subject TEXT NOT NULL,
    user_name TEXT,
    user_id TEXT,
    amount NUMERIC DEFAULT 0,
    filed_by TEXT,
    content TEXT,
    alert_id TEXT,
    reg_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    filed_at TIMESTAMPTZ
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

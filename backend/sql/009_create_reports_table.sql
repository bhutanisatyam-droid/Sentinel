-- Create the reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('STR', 'CTR', 'INTERNAL')),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'FILED', 'REJECTED')),
    subject TEXT NOT NULL,
    user_name TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC DEFAULT 0,
    filed_by TEXT DEFAULT 'System',
    content TEXT,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    reg_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    filed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to select, insert, update 
CREATE POLICY "Allow authenticated users to read reports"
ON public.reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Optional: Create index for faster sorting and searching
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_report_id ON public.reports(report_id);

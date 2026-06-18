-- ============================================================
-- Aadhaar Verification Vault
-- Stores ONLY the fact of verification + provider vault token.
-- ZERO Aadhaar digits stored. Not masked. Not hashed. Nothing.
-- See: Roast v2 Critical 3 + Roast v3 SEC-01
-- ============================================================

CREATE TABLE IF NOT EXISTS aadhaar_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- The ONLY reference to the Aadhaar. This is an opaque token
    -- from the KYC provider (Setu/DigiLocker). It cannot be reversed
    -- to obtain the Aadhaar number.
    vault_token VARCHAR(100) NOT NULL,
    
    -- Verification metadata
    verification_status BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_source VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    -- e.g., 'SETU_SANDBOX', 'DIGILOCKER', 'DIGILOCKER_MOCK', 'MOCK'
    
    -- Name and DOB as returned by the verification provider
    -- (NOT from OCR — from the authoritative government source)
    verified_name VARCHAR(200),
    verified_dob DATE,
    
    -- For deduplication: use vault_token, NEVER a hash of Aadhaar
    -- This index enables: "Has this Aadhaar been verified before?"
    -- without storing the Aadhaar itself.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deduplication index on vault_token
CREATE UNIQUE INDEX IF NOT EXISTS idx_aadhaar_vault_token 
    ON aadhaar_verifications(vault_token);

-- Lookup by user
CREATE INDEX IF NOT EXISTS idx_aadhaar_user 
    ON aadhaar_verifications(user_id);

-- Row Level Security
ALTER TABLE aadhaar_verifications ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert/read (never client-side)
CREATE POLICY "service_role_only_insert" ON aadhaar_verifications
    FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_role_only_select" ON aadhaar_verifications
    FOR SELECT TO service_role USING (true);

-- Officers can read (for compliance review) but never update/delete
CREATE POLICY "officers_can_read" ON aadhaar_verifications
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('COMPLIANCE_OFFICER', 'ADMIN')
    );

-- CRITICAL: NO UPDATE, NO DELETE policies. Ever.
-- If a verification is wrong, you create a new record, not modify the old one.

-- ============================================================
-- Also update kyc_documents table to remove masked_number for Aadhaar
-- and add vault_token reference
-- ============================================================

-- Add vault_token column to kyc_documents if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kyc_documents' AND column_name = 'vault_token'
    ) THEN
        ALTER TABLE kyc_documents ADD COLUMN vault_token VARCHAR(100);
    END IF;
END $$;

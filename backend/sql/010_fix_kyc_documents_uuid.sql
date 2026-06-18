-- Fix user_id column type mismatch in kyc_documents
-- Drop foreign key constraint if it exists (since demo users aren't in auth.users)
ALTER TABLE public.kyc_documents 
  DROP CONSTRAINT IF EXISTS kyc_documents_user_id_fkey;

-- Change the column type from UUID to TEXT to support "demo_user_123"
ALTER TABLE public.kyc_documents 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

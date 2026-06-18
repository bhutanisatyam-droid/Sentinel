-- ═══════════════════════════════════════════════════════════════════════
-- Sentinel — Authentication & RBAC Migration
-- Module 5: Role-Based Access Control
--
-- This script creates the core role enum, the user_profiles table linking
-- to auth.users, and the trigger to automatically establish basic access.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Create the user roles ENUM
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'CUSTOMER',
            'COMPLIANCE_ANALYST',
            'COMPLIANCE_OFFICER',
            'ADMIN'
        );
    END IF;
END $$;

-- 2. Create the user_profiles table extending auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    full_name TEXT,
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
      'CUSTOMER'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Row Level Security (RLS) on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
    ON public.user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Compliance Officers and Admins can view all profiles
CREATE POLICY "Officers and Admins can view all profiles" 
    ON public.user_profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('COMPLIANCE_OFFICER', 'ADMIN')
        )
    );

-- Only Admins can update roles
CREATE POLICY "Admins can update profiles" 
    ON public.user_profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role = 'ADMIN'
        )
    );

-- DriftScout V4: Invite-Code Access Gate
-- Run this in Supabase SQL Editor

-- ============================
-- 1. ADD ROLE COLUMN TO PROFILES
-- ============================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'pending'
  CHECK (role IN ('admin', 'trusted', 'scout', 'pending'));

-- ============================
-- 2. UPDATE HANDLE_NEW_USER TRIGGER (set role = 'pending' for new sign-ups)
-- ============================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Scout'),
    NEW.raw_user_meta_data->>'avatar_url',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger still exists from migration.sql, just the function was replaced

-- ============================
-- 3. CREATE INVITE_CODES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired', 'burned_by_cap'))
);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Trusted/admin users can view their own codes (for the invite panel UI)
CREATE POLICY "View own invite codes"
  ON invite_codes FOR SELECT
  USING (created_by = auth.uid());

-- ============================
-- 4. GENERATE_INVITE_CODE RPC (SECURITY DEFINER)
--    - Checks caller role is admin/trusted
--    - Enforces 3 outstanding active codes cap (burns oldest if exceeded)
--    - Generates 8-char code with 48h expiry
-- ============================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  active_count INT;
  oldest_id UUID;
  creator_role TEXT;
BEGIN
  -- Verify caller is trusted or admin
  SELECT role INTO creator_role FROM profiles WHERE id = auth.uid();
  IF creator_role NOT IN ('admin', 'trusted') THEN
    RAISE EXCEPTION 'Only trusted users and admins can generate invite codes';
  END IF;
  
  -- Check outstanding cap (3 active)
  SELECT COUNT(*) INTO active_count 
  FROM invite_codes 
  WHERE created_by = auth.uid() 
    AND status = 'active' 
    AND expires_at > now();
  
  IF active_count >= 3 THEN
    -- Burn oldest active code
    SELECT id INTO oldest_id 
    FROM invite_codes 
    WHERE created_by = auth.uid() 
      AND status = 'active' 
      AND expires_at > now()
    ORDER BY created_at ASC 
    LIMIT 1;
    
    UPDATE invite_codes SET status = 'burned_by_cap' WHERE id = oldest_id;
  END IF;
  
  -- Generate 8-char uppercase alphanumeric code
  new_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
  
  INSERT INTO invite_codes (code, created_by, expires_at)
  VALUES (new_code, auth.uid(), now() + INTERVAL '48 hours');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 5. VALIDATE_INVITE_CODE RPC (SECURITY DEFINER)
--    - Atomically checks code status
--    - Marks code as used + sets profile role to 'scout' on success
--    - Returns status string for client-side routing
-- ============================
CREATE OR REPLACE FUNCTION validate_invite_code(code_param TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code_row RECORD;
BEGIN
  SELECT * INTO code_row FROM invite_codes WHERE code = code_param;
  
  IF NOT FOUND THEN
    RETURN 'invalid';
  END IF;
  
  IF code_row.status = 'used' THEN
    RETURN 'used';
  END IF;

  IF code_row.status = 'burned_by_cap' THEN
    RETURN 'burned_by_cap';
  END IF;
  
  IF code_row.status = 'expired' OR code_row.expires_at < now() THEN
    UPDATE invite_codes SET status = 'expired' WHERE id = code_row.id AND status = 'active';
    RETURN 'expired';
  END IF;
  
  IF code_row.status != 'active' THEN
    RETURN code_row.status;
  END IF;
  
  -- Valid! Atomically mark as used and upgrade profile role
  UPDATE invite_codes 
  SET status = 'used', used_by = user_id, used_at = now()
  WHERE id = code_row.id;
  
  UPDATE profiles SET role = 'scout' WHERE id = user_id;
  
  RETURN 'valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 6. MIGRATION: Backfill existing profiles
--    - All existing users → trusted (early adopters, close friends)
--    - kasimialam@gmail.com → admin
-- ============================
UPDATE profiles SET role = 'trusted';

UPDATE profiles 
SET role = 'admin' 
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND auth.users.email = 'kasimialam@gmail.com';

-- DriftScout V5.7: Fix generate_invite_code — ensure existing codes have correct target_role
-- Run in Supabase SQL Editor

-- Bug: generate_invite_code returns existing active codes without checking
-- that their target_role matches what it should be. If an admin's existing
-- code has target_role='scout' (from old default or missed backfill), new
-- users get scout instead of trusted.

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
  creator_role TEXT;
  assigned_role TEXT;
BEGIN
  -- Verify caller is trusted or admin
  SELECT role INTO creator_role FROM profiles WHERE id = auth.uid();
  IF creator_role NOT IN ('admin', 'trusted') THEN
    RAISE EXCEPTION 'Only trusted users and admins can generate invite codes';
  END IF;

  -- Determine target role BEFORE the early-return check
  assigned_role := CASE WHEN creator_role = 'admin' THEN 'trusted' ELSE 'scout' END;

  -- Return existing active code if one exists
  SELECT code INTO existing_code
  FROM invite_codes
  WHERE created_by = auth.uid()
    AND status = 'active'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_code IS NOT NULL THEN
    -- Fix target_role if it doesn't match (stale codes from older migrations)
    UPDATE invite_codes
    SET target_role = assigned_role
    WHERE code = existing_code AND target_role != assigned_role;
    RETURN existing_code;
  END IF;

  -- No active code — generate a new one
  new_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));

  INSERT INTO invite_codes (code, created_by, expires_at, target_role)
  VALUES (new_code, auth.uid(), now() + INTERVAL '48 hours', assigned_role);

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any existing admin codes that have the wrong target_role
UPDATE invite_codes
SET target_role = 'trusted'
WHERE target_role != 'trusted'
  AND status = 'active'
  AND expires_at > now()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = invite_codes.created_by
      AND profiles.role = 'admin'
  );

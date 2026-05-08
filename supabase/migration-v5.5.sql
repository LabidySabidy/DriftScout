-- DriftScout V5.5: Multi-Use Invite Links
-- Run in Supabase SQL Editor

-- ============================
-- 1. CREATE INVITE_REDEMPTIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);

ALTER TABLE invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can view redemptions (for tracking who invited who)
CREATE POLICY "Admins can view redemptions"
  ON invite_redemptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================
-- 2. UPDATE GENERATE_INVITE_CODE — single reusable code per user
-- ============================
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

  -- Return existing active code if one exists
  SELECT code INTO existing_code
  FROM invite_codes
  WHERE created_by = auth.uid()
    AND status = 'active'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;

  -- No active code — generate a new one
  assigned_role := CASE WHEN creator_role = 'admin' THEN 'trusted' ELSE 'scout' END;
  new_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));

  INSERT INTO invite_codes (code, created_by, expires_at, target_role)
  VALUES (new_code, auth.uid(), now() + INTERVAL '48 hours', assigned_role);

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 3. UPDATE VALIDATE_INVITE_CODE — multi-use, track redemptions
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

  -- Old single-use codes that were already used
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

  -- Valid! Record redemption (no-op if already redeemed by this user)
  INSERT INTO invite_redemptions (code_id, user_id)
  VALUES (code_row.id, user_id)
  ON CONFLICT (code_id, user_id) DO NOTHING;

  -- Update profile role
  UPDATE profiles SET role = code_row.target_role WHERE id = user_id;

  -- Update last-used tracking on the code
  UPDATE invite_codes SET used_by = user_id, used_at = now() WHERE id = code_row.id;

  RETURN 'valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 4. UPDATE ADMIN_LIST_USERS — count redemptions instead of used codes
-- ============================
DROP FUNCTION IF EXISTS admin_list_users();
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE(
  id UUID,
  username TEXT,
  avatar_url TEXT,
  role TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  spot_count BIGINT,
  like_count BIGINT,
  invites_sent BIGINT,
  invites_accepted BIGINT
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    p.role,
    u.email::TEXT,
    p.created_at,
    (SELECT COUNT(*) FROM locations WHERE submitter_id = p.id)::BIGINT AS spot_count,
    (SELECT COUNT(*) FROM likes WHERE user_id = p.id)::BIGINT AS like_count,
    (SELECT COUNT(DISTINCT ic.id) FROM invite_codes ic WHERE ic.created_by = p.id)::BIGINT AS invites_sent,
    (SELECT COUNT(*) FROM invite_redemptions ir
     JOIN invite_codes ic ON ic.id = ir.code_id
     WHERE ic.created_by = p.id)::BIGINT AS invites_accepted
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

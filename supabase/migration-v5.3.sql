-- DriftScout V5.3: Invite Tiers + Admin Weekly Stats
-- Run in Supabase SQL Editor

-- ============================
-- 1. ADD TARGET_ROLE TO INVITE_CODES
-- ============================
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS target_role TEXT NOT NULL DEFAULT 'scout'
  CHECK (target_role IN ('scout', 'trusted'));

-- Backfill: codes created by admins → trusted, everyone else → scout
UPDATE invite_codes
SET target_role = CASE
  WHEN EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = invite_codes.created_by AND profiles.role = 'admin'
  ) THEN 'trusted'
  ELSE 'scout'
END;

-- ============================
-- 2. UPDATE GENERATE_INVITE_CODE (set target_role based on creator)
-- ============================
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  active_count INT;
  oldest_id UUID;
  creator_role TEXT;
  assigned_role TEXT;
BEGIN
  -- Verify caller is trusted or admin
  SELECT role INTO creator_role FROM profiles WHERE id = auth.uid();
  IF creator_role NOT IN ('admin', 'trusted') THEN
    RAISE EXCEPTION 'Only trusted users and admins can generate invite codes';
  END IF;

  -- Admin codes → trusted, trusted codes → scout
  assigned_role := CASE WHEN creator_role = 'admin' THEN 'trusted' ELSE 'scout' END;

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

  INSERT INTO invite_codes (code, created_by, expires_at, target_role)
  VALUES (new_code, auth.uid(), now() + INTERVAL '48 hours', assigned_role);

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 3. UPDATE VALIDATE_INVITE_CODE (use target_role from code row)
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

  -- Valid! Atomically mark as used and set role from code's target_role
  UPDATE invite_codes
  SET status = 'used', used_by = user_id, used_at = now()
  WHERE id = code_row.id;

  UPDATE profiles SET role = code_row.target_role WHERE id = user_id;

  RETURN 'valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 4. ADMIN_WEEKLY_STATS RPC
--    Returns aggregate stats for admin dashboard
-- ============================
CREATE OR REPLACE FUNCTION admin_weekly_stats()
RETURNS JSONB AS $$
DECLARE
  week_ago TIMESTAMPTZ;
  caller_role TEXT;
  total_users BIGINT;
  new_users_week BIGINT;
  total_spots BIGINT;
  new_spots_week BIGINT;
  total_likes BIGINT;
  new_likes_week BIGINT;
  active_users_week BIGINT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;

  week_ago := now() - INTERVAL '7 days';

  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO new_users_week FROM profiles WHERE created_at >= week_ago;
  SELECT COUNT(*) INTO total_spots FROM locations;
  SELECT COUNT(*) INTO new_spots_week FROM locations WHERE created_at >= week_ago;
  SELECT COUNT(*) INTO total_likes FROM likes;
  SELECT COUNT(*) INTO new_likes_week FROM likes WHERE created_at >= week_ago;

  -- Active users: distinct users who liked, commented, or submitted this week
  SELECT COUNT(DISTINCT uid) INTO active_users_week
  FROM (
    SELECT user_id AS uid FROM likes WHERE created_at >= week_ago
    UNION
    SELECT user_id AS uid FROM comments WHERE created_at >= week_ago
    UNION
    SELECT submitter_id AS uid FROM locations WHERE created_at >= week_ago
  ) activity;

  RETURN jsonb_build_object(
    'total_users', total_users,
    'new_users_week', new_users_week,
    'total_spots', total_spots,
    'new_spots_week', new_spots_week,
    'total_likes', total_likes,
    'new_likes_week', new_likes_week,
    'active_users_week', active_users_week
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

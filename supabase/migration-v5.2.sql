-- DriftScout V5.2: Admin User Listing RPC
-- Run in Supabase SQL Editor

-- ============================
-- ADMIN_LIST_USERS RPC (SECURITY DEFINER)
--    Returns all profiles with email + stats for admin dashboard
-- ============================
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
  -- Verify caller is admin
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
    (SELECT COUNT(*) FROM invite_codes WHERE created_by = p.id)::BIGINT AS invites_sent,
    (SELECT COUNT(*) FROM invite_codes WHERE created_by = p.id AND status = 'used')::BIGINT AS invites_accepted
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

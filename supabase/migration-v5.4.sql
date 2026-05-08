-- DriftScout V5.4: Admin Set Role RPC
-- Run in Supabase SQL Editor

-- ============================
-- ADMIN_SET_ROLE RPC (SECURITY DEFINER)
--    Admin changes a user's role. Cannot change own role.
-- ============================
CREATE OR REPLACE FUNCTION admin_set_role(target_user_id UUID, new_role TEXT)
RETURNS TEXT AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verify caller is admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RETURN 'unauthorized';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RETURN 'cannot_change_own_role';
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'trusted', 'scout', 'pending') THEN
    RETURN 'invalid_role';
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;

  RETURN 'ok';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

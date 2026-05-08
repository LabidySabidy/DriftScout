-- DriftScout V5.1: Admin User Management
-- Run in Supabase SQL Editor

-- ============================
-- ADMIN_DELETE_USER RPC (SECURITY DEFINER)
--    Deletes a user account. If delete_assets = true, cascades everything.
--    If delete_assets = false, transfers locations to admin before deleting user.
-- ============================
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID, delete_assets BOOLEAN)
RETURNS TEXT AS $$
DECLARE
  caller_role TEXT;
  admin_id UUID;
BEGIN
  -- Verify caller is admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RETURN 'unauthorized';
  END IF;

  -- Get admin's user ID for asset transfer
  admin_id := auth.uid();

  IF delete_assets = false THEN
    -- Transfer locations to admin before cascade delete
    UPDATE locations SET submitter_id = admin_id WHERE submitter_id = target_user_id;
    -- Transfer invite_codes to admin
    UPDATE invite_codes SET created_by = admin_id WHERE created_by = target_user_id;
    UPDATE invite_codes SET used_by = NULL WHERE used_by = target_user_id;
  END IF;

  -- Delete the auth user (cascades to profile → locations → everything)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

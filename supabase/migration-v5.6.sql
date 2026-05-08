-- DriftScout V5.6: Fix ambiguous user_id parameter in validate_invite_code
-- Run in Supabase SQL Editor

-- The parameter name "user_id" shadows the column "user_id" in invite_redemptions,
-- causing "column reference user_id is ambiguous" on the ON CONFLICT clause.
-- Rename parameter to "uid" to disambiguate.

CREATE OR REPLACE FUNCTION validate_invite_code(code_param TEXT, uid UUID)
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
  VALUES (code_row.id, uid)
  ON CONFLICT (code_id, user_id) DO NOTHING;

  -- Update profile role
  UPDATE profiles SET role = code_row.target_role WHERE id = uid;

  -- Update last-used tracking on the code
  UPDATE invite_codes SET used_by = uid, used_at = now() WHERE id = code_row.id;

  RETURN 'valid';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DriftScout V4.1: Unauthenticated invite code status check
-- Run in Supabase SQL Editor (appends to migration-v4)

-- ============================
-- CHECK_INVITE_CODE RPC (SECURITY DEFINER, no auth required)
--    Returns code status for immediate UI feedback before sign-in.
--    Does NOT mark the code as used — that's done by validate_invite_code.
-- ============================
CREATE OR REPLACE FUNCTION check_invite_code(code_param TEXT)
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
    RETURN 'expired';
  END IF;
  
  IF code_row.status != 'active' THEN
    RETURN code_row.status;
  END IF;
  
  RETURN 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow unauthenticated access to this RPC
GRANT EXECUTE ON FUNCTION check_invite_code(TEXT) TO anon, authenticated;

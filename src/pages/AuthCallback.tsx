import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    let cancelled = false;

    const handleCallback = async () => {
      // Wait for Supabase to process the OAuth callback and set the session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Session may still be in URL fragment — retry after a tick
        await new Promise(r => setTimeout(r, 500));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (!retrySession) {
          if (!cancelled) navigate('/login', { replace: true });
          return;
        }
        await processSession(retrySession);
      } else {
        await processSession(session);
      }
    };

    const processSession = async (session: { user: { id: string } }) => {
      const inviteCode = sessionStorage.getItem('invite_code');

      if (inviteCode) {
        // Validate invite code
        setStatus('Validating invite code...');
        const { data: result, error } = await supabase.rpc('validate_invite_code', {
          code_param: inviteCode,
          user_id: session.user.id,
        });

        sessionStorage.removeItem('invite_code');

        if (error) {
          console.error('Invite code validation error:', error);
          // Pass error details so InviteRequiredPage can show them
          const msg = error.message || String(error);
          await supabase.auth.signOut();
          if (!cancelled) navigate(`/invite-required?reason=rpc&error=${encodeURIComponent(msg)}`, { replace: true });
          return;
        }

        if (result !== 'valid') {
          // Code was invalid/expired/used — pass reason to InviteRequiredPage
          await supabase.auth.signOut();
          if (!cancelled) navigate(`/invite-required?reason=code&code=${encodeURIComponent(inviteCode)}&status=${encodeURIComponent(result as string)}`, { replace: true });
          return;
        }

        // Code valid, profile upgraded to scout — let ProtectedRoute handle the rest
      } else {
        // No invite code — check if user is allowed (existing trusted/admin users)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role === 'pending') {
          // New sign-up without invite code — boot them
          await supabase.auth.signOut();
          if (!cancelled) navigate('/invite-required?reason=no_access', { replace: true });
          return;
        }
        // Existing trusted/admin/scout user — allow through
      }

      if (!cancelled) navigate('/', { replace: true });
    };

    handleCallback();

    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ink-mute text-sm">{status}</p>
      </div>
    </div>
  );
}

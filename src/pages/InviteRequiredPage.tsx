import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function InviteRequiredPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const rpcError = searchParams.get('error');
  const codeStatus = searchParams.get('status');
  const usedCode = searchParams.get('code');

  // Re-check profile on mount and when user changes —
  // if admin promoted the user, immediately redirect out
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && data.role !== 'pending') {
          navigate('/', { replace: true });
        }
      });
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/background.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Message card */}
      <div className="relative z-10 text-center w-full max-w-md px-6 py-10 mx-4 rounded-card bg-black/25 backdrop-blur-md border border-white/10">
        <h1
          className="flex items-center justify-center gap-2 text-[36px] font-bold mb-6 text-white drop-shadow-lg"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          <img src="/logo-icon.png" alt="" className="w-10 h-auto" />
          DriftScout
        </h1>

        <div className="mb-6">
          <p className="text-white/90 text-[16px] font-semibold mb-2">
            Access Restricted
          </p>
          {reason === 'rpc' && rpcError ? (
            <div className="mb-3 p-3 rounded bg-red-500/10 border border-red-500/30 text-left">
              <p className="text-red-400/80 text-[10px] uppercase tracking-[.06em] font-mono mb-1">Validation Error</p>
              <p className="text-red-300/80 text-[12px] font-mono break-all leading-relaxed">{rpcError}</p>
            </div>
          ) : reason === 'code' && usedCode ? (
            <div className="mb-3 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-left">
              <p className="text-amber-400/80 text-[10px] uppercase tracking-[.06em] font-mono mb-1">Code {codeStatus}</p>
              <p className="text-amber-300/80 text-[12px] font-mono break-all">Code: {usedCode}</p>
            </div>
          ) : (
            <p className="text-white/60 text-[14px] leading-relaxed max-w-[320px] mx-auto">
              You need an invite code to access DriftScout. Ask someone in
              the community to send you an invite link.
            </p>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="text-[13px] text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors"
        >
          Sign out and return to login
        </button>
      </div>
    </div>
  );
}

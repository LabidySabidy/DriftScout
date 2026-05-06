import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      } else {
        // Wait a tick for the session to be picked up from the URL fragment
        const timer = setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
              navigate('/', { replace: true });
            } else {
              navigate('/login', { replace: true });
            }
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <p className="text-zinc-400">Signing you in...</p>
    </div>
  );
}

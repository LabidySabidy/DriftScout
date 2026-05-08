import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
      if (data && data.username !== 'Scout') navigate('/', { replace: true });
    });
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ username: username.trim() }).eq('id', user.id);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg text-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm lg:max-w-[400px] lg:rounded-card lg:border lg:border-chip-border lg:bg-surface lg:p-10 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold mb-2" style={{ fontFamily: "'Pacifico', cursive" }}>
          <img src="/logo-icon.png" alt="" className="w-7 h-auto" />
          DriftScout
        </h1>
        <p className="text-ink-mute mb-6">Pick a username for your profile</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          className="w-full bg-surface rounded-card px-4 py-3 text-ink text-center text-lg outline-none focus:ring-2 focus:ring-accent mb-3"
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} disabled={!username.trim() || saving} className="w-full bg-ink text-bg font-semibold py-3 rounded-card disabled:opacity-40 mb-3 active:scale-[.97] transition-transform duration-100">
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <button onClick={() => navigate('/', { replace: true })} className="text-sm text-ink-mute hover:text-ink">
          Skip for now
        </button>
      </div>
    </div>
  );
}

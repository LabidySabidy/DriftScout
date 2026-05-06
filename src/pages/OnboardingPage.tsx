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
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && data.username !== 'Scout') {
          navigate('/', { replace: true });
        }
      });
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ username: username.trim() }).eq('id', user.id);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to DriftScout</h1>
        <p className="text-zinc-400 mb-6">Pick a username for your profile</p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          className="w-full bg-zinc-900 rounded-lg px-4 py-3 text-white text-center text-lg outline-none focus:ring-2 focus:ring-white/20 mb-3"
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        <button
          onClick={handleSave}
          disabled={!username.trim() || saving}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg disabled:opacity-40 mb-3"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>

        <button
          onClick={() => navigate('/', { replace: true })}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

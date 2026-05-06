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
    <div className="min-h-screen bg-app-bg text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Pacifico', cursive" }}>DriftScout</h1>
        <p className="text-muted mb-6">Pick a username for your profile</p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your username"
          className="w-full bg-input-fill rounded-2xl px-4 py-3 text-white text-center text-lg outline-none focus:ring-2 focus:ring-white/20 mb-3"
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} disabled={!username.trim() || saving} className="w-full bg-white text-black font-semibold py-3 rounded-2xl disabled:opacity-40 mb-3">
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <button onClick={() => navigate('/', { replace: true })} className="text-sm text-muted hover:text-white">
          Skip for now
        </button>
      </div>
    </div>
  );
}

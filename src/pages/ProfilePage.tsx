import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLikes } from '../hooks/useLikes';
import { useIsDesktop } from '../hooks/useIsDesktop';
import type { LocationWithSubmitter } from '../types';
import LocationCard from '../components/LocationCard';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { likedIds } = useLikes();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [submitted, setSubmitted] = useState<LocationWithSubmitter[]>([]);
  const [liked, setLiked] = useState<LocationWithSubmitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'submitted' | 'liked'>('submitted');
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from('locations')
        .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false }),
      likedIds.size > 0
        ? supabase
            .from('locations')
            .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
            .in('id', Array.from(likedIds))
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single(),
    ]).then(([s, l, p]) => {
      if (s.data) setSubmitted(s.data as LocationWithSubmitter[]);
      if (l.data) setLiked(l.data as LocationWithSubmitter[]);
      if (p.data) setProfile(p.data);
      setLoading(false);
    });
  }, [user, likedIds]);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Scout';
  const displayName = profile?.username || googleName;

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || !user) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: trimmed }, { onConflict: 'id' });
    if (!error) {
      setProfile((prev) => prev ? { ...prev, username: trimmed } : { username: trimmed, avatar_url: null });
    }
    setEditingName(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    const path = `avatars/${user.id}`;
    await supabase.storage.from('location-photos').upload(path, file, { upsert: true });
    const avatarUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${path}`;
    await supabase.from('profiles').upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' });
    setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : { username: null, avatar_url: avatarUrl });
    setUploadingAvatar(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = (
    <div className="flex justify-center gap-8 lg:grid lg:grid-cols-3 lg:gap-3 lg:text-left lg:justify-start">
      <div className="text-center lg:text-left">
        <p className="font-display font-bold text-[20px] text-ink">{submitted.length}</p>
        <p className="text-[10px] uppercase tracking-[.08em] text-ink-mute font-mono mt-0.5">Spots</p>
      </div>
      <div className="text-center lg:text-left">
        <p className="font-display font-bold text-[20px] text-ink">{liked.length}</p>
        <p className="text-[10px] uppercase tracking-[.08em] text-ink-mute font-mono mt-0.5">Liked</p>
      </div>
    </div>
  );

  const displayNameEl = editingName ? (
    <input
      type="text"
      value={nameValue}
      onChange={(e) => setNameValue(e.target.value)}
      onBlur={handleSaveName}
      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
      className="font-display font-bold text-[22px] lg:text-[26px] text-ink bg-surface border border-accent rounded-card px-3 py-1 outline-none w-full max-w-[260px] text-center lg:text-left"
      autoFocus
    />
  ) : (
    <h1
      className="font-display font-bold text-[22px] lg:text-[26px] text-ink cursor-pointer hover:text-accent transition-colors"
      onClick={() => { setNameValue(displayName); setEditingName(true); }}
      title="Click to edit"
    >
      {displayName}
    </h1>
  );

  const avatarEl = (
    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={`w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-full bg-surface ring-2 ring-chip-border object-cover transition-opacity ${uploadingAvatar ? 'opacity-50' : 'group-hover:opacity-80'}`} />
      ) : (
        <div className={`w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-full bg-surface ring-2 ring-chip-border transition-opacity ${uploadingAvatar ? 'opacity-50' : 'group-hover:opacity-80'}`} />
      )}
      <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {uploadingAvatar ? (
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="drop-shadow-lg">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        )}
      </div>
    </div>
  );

  const profileHeader = (
    <div className="lg:sticky lg:top-10 lg:self-start lg:space-y-5">
      <div className="flex flex-col items-center gap-3 mb-2 lg:items-start">
        {avatarEl}
        {displayNameEl}
      </div>
      {stats}
      <button onClick={signOut} className="hidden lg:inline-flex text-xs text-ink-mute hover:text-ink border border-chip-border rounded-pill px-4 py-1.5 active:scale-[.97] transition-transform duration-100 mt-4">
        Sign out
      </button>
    </div>
  );

  const tabs = (
    <div className="mt-6 border-b border-tab-border flex lg:mt-0">
      <button
        onClick={() => setTab('submitted')}
        className={`flex-1 py-3 text-[13px] font-mono relative active:scale-[.97] transition-transform duration-100 ${
          tab === 'submitted'
            ? 'text-ink after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-ink'
            : 'text-ink-mute'
        }`}
      >
        Submitted ({submitted.length})
      </button>
      <button
        onClick={() => setTab('liked')}
        className={`flex-1 py-3 text-[13px] font-mono relative active:scale-[.97] transition-transform duration-100 ${
          tab === 'liked'
            ? 'text-ink after:absolute after:left-0 after:right-0 after:bottom-0 after:h-0.5 after:bg-ink'
            : 'text-ink-mute'
        }`}
      >
        Liked ({liked.length})
      </button>
    </div>
  );

  const content = tab === 'submitted' ? (
    submitted.length === 0 ? (
      <div className="text-center py-12 text-ink-mute">
        <p className="text-lg mb-2">No spots submitted yet</p>
        <button onClick={() => navigate('/submit')} className="text-sm bg-ink text-bg px-5 py-2.5 rounded-card font-semibold active:scale-[.97] transition-transform duration-100">
          Submit your first spot
        </button>
      </div>
    ) : isDesktop ? (
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        {submitted.map((loc) => (
          <LocationCard key={loc.id} location={loc} onClick={() => navigate(`/location/${loc.id}`)} />
        ))}
      </div>
    ) : (
      <div className="divide-y divide-tab-border">
        {submitted.map((loc) => (
          <div key={loc.id} onClick={() => navigate(`/location/${loc.id}`)} className="flex gap-3 py-3 cursor-pointer active:scale-[.98] transition-transform duration-100">
            {loc.photos?.[0]?.storage_path ? (
              <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${loc.photos[0].storage_path}`} alt="" className="w-[78px] h-[78px] rounded object-cover bg-surface shrink-0" />
            ) : (
              <div className="w-[78px] h-[78px] rounded bg-surface shrink-0" />
            )}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <p className="text-[14px] font-semibold text-ink truncate">{loc.name}</p>
              <p className="text-[12px] text-ink-mute font-mono mt-0.5">{loc.city}, {loc.state}</p>
              {loc.tags && loc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {loc.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] text-ink-mute bg-surface px-2 py-0.5 rounded-pill border border-chip-border">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  ) : liked.length === 0 ? (
    <div className="text-center py-12 text-ink-mute">
      <p className="text-lg mb-2">No liked spots yet</p>
      <button onClick={() => navigate('/')} className="text-sm text-accent underline">
        Browse spots
      </button>
    </div>
  ) : isDesktop ? (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
      {liked.map((loc) => (
        <LocationCard key={loc.id} location={loc} isLiked onToggleLike={() => navigate(`/location/${loc.id}`)} onClick={() => navigate(`/location/${loc.id}`)} />
      ))}
    </div>
  ) : (
    <div className="divide-y divide-tab-border">
      {liked.map((loc) => (
        <div key={loc.id} onClick={() => navigate(`/location/${loc.id}`)} className="flex gap-3 py-3 cursor-pointer active:scale-[.98] transition-transform duration-100">
          {loc.photos?.[0]?.storage_path ? (
            <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${loc.photos[0].storage_path}`} alt="" className="w-[78px] h-[78px] rounded object-cover bg-surface shrink-0" />
          ) : (
            <div className="w-[78px] h-[78px] rounded bg-surface shrink-0" />
          )}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <p className="text-[14px] font-semibold text-ink truncate">{loc.name}</p>
            <p className="text-[12px] text-ink-mute font-mono mt-0.5">{loc.city}, {loc.state}</p>
            {loc.tags && loc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {loc.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] text-ink-mute bg-surface px-2 py-0.5 rounded-pill border border-chip-border">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Desktop: two-column ──
  if (isDesktop) {
    return (
      <div className="max-w-[1100px] mx-auto px-8 py-10">
        <div className="grid grid-cols-[280px_1fr] gap-10">
          {profileHeader}
          <div>
            {tabs}
            <div className="mt-5">
              {content}
            </div>
          </div>
        </div>
        <button onClick={signOut} className="lg:hidden text-xs text-ink-mute hover:text-ink border border-chip-border rounded-pill px-4 py-1.5 mt-4 active:scale-[.97] transition-transform duration-100">
          Sign out
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAvatarUpload(file);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  // ── Mobile ──
  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex flex-col items-center gap-3 mb-2">
        {avatarEl}
        {displayNameEl}
      </div>
      <div className="flex justify-center gap-8 mt-3">
        <div className="text-center">
          <p className="font-display font-bold text-[20px] text-ink">{submitted.length}</p>
          <p className="text-[10px] uppercase tracking-[.08em] text-ink-mute font-mono mt-0.5">Spots</p>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-[20px] text-ink">{liked.length}</p>
          <p className="text-[10px] uppercase tracking-[.08em] text-ink-mute font-mono mt-0.5">Liked</p>
        </div>
      </div>
      <button onClick={signOut} className="text-xs text-ink-mute hover:text-ink border border-chip-border rounded-pill px-4 py-1.5 mt-4 active:scale-[.97] transition-transform duration-100">
        Sign out
      </button>
      {tabs}
      <div className="mt-4">
        {content}
      </div>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

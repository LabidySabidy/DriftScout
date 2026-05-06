import { useState, useEffect } from 'react';
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
    ]).then(([s, l]) => {
      if (s.data) setSubmitted(s.data as LocationWithSubmitter[]);
      if (l.data) setLiked(l.data as LocationWithSubmitter[]);
      setLoading(false);
    });
  }, [user, likedIds]);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Scout';

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

  const profileHeader = (
    <div className="lg:sticky lg:top-10 lg:self-start lg:space-y-5">
      <div className="flex flex-col items-center gap-3 mb-2 lg:items-start">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-full bg-surface ring-2 ring-chip-border object-cover" />
        ) : (
          <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-full bg-surface ring-2 ring-chip-border" />
        )}
        <h1 className="font-display font-bold text-[22px] text-ink lg:text-[26px]">{displayName}</h1>
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
    ) : (
      <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
        {submitted.map((loc) => (
          <LocationCard key={loc.id} location={loc} onClick={() => navigate(`/location/${loc.id}`)} />
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
  ) : (
    <div className="lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-5">
      {liked.map((loc) => (
        <LocationCard key={loc.id} location={loc} isLiked onToggleLike={() => navigate(`/location/${loc.id}`)} onClick={() => navigate(`/location/${loc.id}`)} />
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
      </div>
    );
  }

  // ── Mobile ──
  return (
    <div className="px-4 pt-3 pb-20">
      {profileHeader}
      <button onClick={signOut} className="text-xs text-ink-mute hover:text-ink border border-chip-border rounded-pill px-4 py-1.5 active:scale-[.97] transition-transform duration-100">
        Sign out
      </button>
      {tabs}
      <div className="mt-4">
        {content}
      </div>
    </div>
  );
}

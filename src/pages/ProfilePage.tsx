import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLikes } from '../hooks/useLikes';
import type { LocationWithSubmitter } from '../types';
import LocationCard from '../components/LocationCard';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { likedIds } = useLikes();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-20">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-4">
        {user?.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="" className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-input-fill" />
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Scout'}
          </h1>
          <p className="text-sm text-muted">{submitted.length} spots shared</p>
        </div>
        <button onClick={signOut} className="text-xs text-muted hover:text-white border border-chip-border rounded-full px-4 py-1.5">
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-tab-bar-border mb-4">
        <button onClick={() => setTab('submitted')} className={`flex-1 py-2.5 text-sm font-medium text-center ${tab === 'submitted' ? 'text-white border-b-2 border-white' : 'text-tab-inactive'}`}>
          Submitted ({submitted.length})
        </button>
        <button onClick={() => setTab('liked')} className={`flex-1 py-2.5 text-sm font-medium text-center ${tab === 'liked' ? 'text-white border-b-2 border-white' : 'text-tab-inactive'}`}>
          Liked ({liked.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'submitted' ? (
        submitted.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-lg mb-2">No spots submitted yet</p>
            <button onClick={() => navigate('/submit')} className="text-sm bg-white text-black px-5 py-2.5 rounded-2xl font-semibold">
              Submit your first spot
            </button>
          </div>
        ) : (
          submitted.map((loc) => (
            <LocationCard key={loc.id} location={loc} onClick={() => navigate(`/location/${loc.id}`)} />
          ))
        )
      ) : liked.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-lg mb-2">No liked spots yet</p>
          <button onClick={() => navigate('/')} className="text-sm text-accent-link underline">
            Browse spots
          </button>
        </div>
      ) : (
        liked.map((loc) => (
          <LocationCard key={loc.id} location={loc} isLiked onToggleLike={() => navigate(`/location/${loc.id}`)} onClick={() => navigate(`/location/${loc.id}`)} />
        ))
      )}
    </div>
  );
}

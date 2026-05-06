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
      // Submitted
      supabase
        .from('locations')
        .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false }),
      // Liked
      likedIds.size > 0
        ? supabase
            .from('locations')
            .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
            .in('id', Array.from(likedIds))
        : Promise.resolve({ data: [], error: null }),
    ]).then(([submittedRes, likedRes]) => {
      if (submittedRes.data) setSubmitted(submittedRes.data as LocationWithSubmitter[]);
      if (likedRes.data) setLiked(likedRes.data as LocationWithSubmitter[]);
      setLoading(false);
    });
  }, [user, likedIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Scout'}
            </h1>
            <p className="text-sm text-zinc-400">
              {submitted.length} spots shared
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setTab('submitted')}
          className={`flex-1 py-3 text-sm font-medium text-center ${
            tab === 'submitted'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-500'
          }`}
        >
          Submitted ({submitted.length})
        </button>
        <button
          onClick={() => setTab('liked')}
          className={`flex-1 py-3 text-sm font-medium text-center ${
            tab === 'liked'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-500'
          }`}
        >
          Liked ({liked.length})
        </button>
      </div>

      {/* List */}
      <div className="px-4 py-4 pb-8">
        {tab === 'submitted' ? (
          submitted.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-lg mb-2">No spots submitted yet</p>
              <button
                onClick={() => navigate('/submit')}
                className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium"
              >
                Submit your first spot
              </button>
            </div>
          ) : (
            submitted.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                onClick={() => navigate(`/location/${loc.id}`)}
              />
            ))
          )
        ) : liked.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">No liked spots yet</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-zinc-400 underline"
            >
              Browse spots
            </button>
          </div>
        ) : (
          liked.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isLiked
              onClick={() => navigate(`/location/${loc.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

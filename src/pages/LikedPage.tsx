/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLikes } from '../hooks/useLikes';
import LocationCard from '../components/LocationCard';
import type { LocationWithSubmitter } from '../types';

export default function LikedPage() {
  const { user } = useAuth();
  const { likedIds, toggleLike } = useLikes();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationWithSubmitter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || likedIds.size === 0) { setLoading(false); return; }
    supabase
      .from('locations')
      .select('*, submitter:profiles!locations_submitter_id_fkey(*), photos:location_photos(*)')
      .in('id', Array.from(likedIds))
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setLocations(data as LocationWithSubmitter[]);
        setLoading(false);
      });
  }, [user, likedIds]);

  return (
    <div className="px-4 pt-3 pb-20">
      <h1 className="text-xl font-bold mb-4">Liked Spots</h1>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-input-fill h-[50vh] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg mb-2">No liked spots yet</p>
          <button onClick={() => navigate('/')} className="text-sm text-accent-link underline">
            Browse spots
          </button>
        </div>
      ) : (
        locations.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            isLiked
            onToggleLike={() => toggleLike(loc.id)}
            onClick={() => navigate(`/location/${loc.id}`)}
          />
        ))
      )}
    </div>
  );
}

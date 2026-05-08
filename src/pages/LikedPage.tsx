/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLikes } from '../hooks/useLikes';
import { useIsDesktop } from '../hooks/useIsDesktop';
import LocationCard from '../components/LocationCard';
import type { LocationWithSubmitter } from '../types';

export default function LikedPage() {
  const { user } = useAuth();
  const { likedIds, toggleLike } = useLikes();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
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
    <div className="px-4 pt-3 pb-20 lg:max-w-[1100px] lg:mx-auto lg:px-8 lg:py-8">
      <h1 className="text-xl font-bold mb-4 lg:font-display lg:text-[26px] lg:tracking-tight lg:mb-6">Liked Spots</h1>

      {loading ? (
        <div className={isDesktop ? 'grid grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-6'}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface h-[50vh] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16 text-ink-mute">
          <p className="text-lg mb-2">No liked spots yet</p>
          <button onClick={() => navigate('/')} className="text-sm text-accent underline">
            Browse spots
          </button>
        </div>
      ) : isDesktop ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isLiked
              onToggleLike={() => toggleLike(loc.id)}
              onClick={() => navigate(`/location/${loc.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => navigate(`/location/${loc.id}`)}
              className="flex items-center gap-3 p-2 rounded-card cursor-pointer active:scale-[.98] transition-transform duration-100 hover:bg-surface"
            >
              {loc.photos?.[0]?.storage_path ? (
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${loc.photos[0].storage_path}`}
                  alt=""
                  className="w-12 h-12 rounded object-cover bg-surface shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-surface shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink truncate">{loc.name}</p>
                <p className="text-[11px] font-mono text-ink-mute">{loc.city}, {loc.state}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleLike(loc.id); }}
                className="p-1 text-danger"
              >
                ❤️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

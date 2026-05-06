import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocations } from '../hooks/useLocations';
import { useLikes } from '../hooks/useLikes';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import Leaderboard from '../components/Leaderboard';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locations, userCoords, radius, setRadius, loading, geoError, refresh } =
    useLocations();
  const { likedIds, toggleLike } = useLikes();
  const [refreshing, setRefreshing] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const filteredLocations = filterTag
    ? locations.filter((loc) => loc.tags?.includes(filterTag))
    : locations;

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    // Keep spinner visible for at least 600ms for UX
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold">DriftScout</h1>
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-8 h-8 rounded-full cursor-pointer"
              onClick={() => navigate('/profile')}
            />
          )}
          <button
            onClick={() => navigate('/submit')}
            className="text-sm bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
          >
            + Add Spot
          </button>
        </div>
      </header>

      {/* Map */}
      {userCoords && <MapView locations={locations} center={userCoords} />}

      {/* Radius filter */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-zinc-800">
        <span className="text-sm text-zinc-400 whitespace-nowrap">
          Within {radius} miles
        </span>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Location count + refresh */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {geoError && (
            <span className="text-yellow-500 mr-2">⚠ {geoError}</span>
          )}
          <strong className="text-white">{filteredLocations.length}</strong> spots found
          {filterTag && (
            <>
              {' '}
              <span className="text-zinc-400">· #{filterTag}</span>
              <button
                onClick={() => setFilterTag(null)}
                className="ml-1 text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </>
          )}
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-sm text-zinc-400 hover:text-white disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Location feed */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900 rounded-xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">No spots found</p>
            <p className="text-sm">
              {filterTag ? 'Try removing the tag filter' : 'Try increasing the search radius'}
            </p>
          </div>
        ) : (
          filteredLocations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isLiked={likedIds.has(loc.id)}
              onToggleLike={() => toggleLike(loc.id)}
              onTagClick={(tag) => setFilterTag(tag)}
              onClick={() => navigate(`/location/${loc.id}`)}
            />
          ))
        )}
      </div>

      {/* Leaderboard */}
      <div className="border-t border-zinc-800 mt-2">
        <Leaderboard />
      </div>
    </div>
  );
}

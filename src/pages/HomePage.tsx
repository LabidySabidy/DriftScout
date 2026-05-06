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
  const [searchCity, setSearchCity] = useState('');
  const [showMap, setShowMap] = useState(true);

  let filteredLocations = filterTag
    ? locations.filter((loc) => loc.tags?.includes(filterTag))
    : locations;

  if (searchCity.trim()) {
    const q = searchCity.trim().toLowerCase();
    filteredLocations = filteredLocations.filter(
      (loc) => loc.city.toLowerCase().includes(q) || loc.name.toLowerCase().includes(q)
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="px-4 py-3 bg-zinc-900/80 backdrop-blur sticky top-0 z-10 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">DriftScout</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMap(!showMap)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
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
              + Add
            </button>
          </div>
        </div>
        {/* Search */}
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Search by city or spot name..."
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20 placeholder:text-zinc-500"
        />
      </header>

      {/* Map */}
      {showMap && userCoords && <MapView locations={filteredLocations} center={userCoords} />}

      {/* Radius filter */}
      <div className="px-4 py-2 flex items-center gap-3 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 whitespace-nowrap">
          {radius} mi
        </span>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-white h-1"
        />
      </div>

      {/* Location count + refresh */}
      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {geoError && (
            <span className="text-yellow-500 mr-2">⚠ {geoError}</span>
          )}
          <strong className="text-white">{filteredLocations.length}</strong> spots
          {filterTag && (
            <>
              {' '}<span className="text-zinc-400">· #{filterTag}</span>
              <button onClick={() => setFilterTag(null)} className="ml-1 text-zinc-500 hover:text-white">✕</button>
            </>
          )}
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-zinc-500 hover:text-white disabled:opacity-50"
        >
          {refreshing ? '...' : '↻'}
        </button>
      </div>

      {/* Location feed */}
      <div className="px-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">No spots found</p>
            <p className="text-sm">
              {filterTag || searchCity ? 'Try removing filters' : 'Try increasing the search radius'}
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

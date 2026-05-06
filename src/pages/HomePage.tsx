import { useAuth } from '../hooks/useAuth';
import { useLocations } from '../hooks/useLocations';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const { locations, userCoords, radius, setRadius, loading, geoError } =
    useLocations();

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
              className="w-8 h-8 rounded-full"
            />
          )}
          <button
            onClick={signOut}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Sign out
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

      {/* Location count */}
      <div className="px-4 py-3">
        <p className="text-sm text-zinc-500">
          {geoError && (
            <span className="text-yellow-500 mr-2">⚠ {geoError}</span>
          )}
          <strong className="text-white">{locations.length}</strong> spots found
        </p>
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
        ) : locations.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-lg mb-2">No spots found</p>
            <p className="text-sm">Try increasing the search radius</p>
          </div>
        ) : (
          locations.map((loc) => <LocationCard key={loc.id} location={loc} />)
        )}
      </div>
    </div>
  );
}

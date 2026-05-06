import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLocations } from '../hooks/useLocations';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import { useLikes } from '../hooks/useLikes';

export default function LocationsPage() {
  const navigate = useNavigate();
  const { locations, userCoords, radius, setRadius, loading } = useLocations();
  const { likedIds, toggleLike } = useLikes();
  const [searchCity, setSearchCity] = useState('');

  const filtered = searchCity.trim()
    ? locations.filter((loc) =>
        loc.city.toLowerCase().includes(searchCity.trim().toLowerCase()) ||
        loc.name.toLowerCase().includes(searchCity.trim().toLowerCase()))
    : locations;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-input-fill rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search city or spot..."
              className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-muted"
            />
          </div>
          <button className="bg-input-fill rounded-2xl px-4 py-2.5 text-sm font-medium text-white">
            Filters
          </button>
        </div>
      </div>

      {/* Results summary */}
      <div className="px-4 py-2 flex items-center justify-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B8AFF" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-[13px] text-muted">
          <strong className="text-white">{filtered.length}</strong> spots found within {radius} miles.
        </span>
      </div>

      {/* Map */}
      {userCoords && (
        <div className="h-48 mx-4 rounded-2xl overflow-hidden mb-3">
          <MapView locations={filtered} center={userCoords} />
        </div>
      )}

      {/* Radius */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <span className="text-xs text-muted">{radius} mi</span>
        <input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-white h-1" />
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-input-fill h-[50vh] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-lg mb-2">No spots found</p>
            <p className="text-sm">Try increasing the search radius</p>
          </div>
        ) : (
          filtered.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isLiked={likedIds.has(loc.id)}
              onToggleLike={() => toggleLike(loc.id)}
              onClick={() => navigate(`/location/${loc.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

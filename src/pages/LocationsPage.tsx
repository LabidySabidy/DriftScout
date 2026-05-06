import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useLocations } from '../hooks/useLocations';
import { useLikes } from '../hooks/useLikes';
import { useIsDesktop } from '../hooks/useIsDesktop';
import MapView from '../components/MapView';
import LocationCard from '../components/LocationCard';
import type { LocationWithSubmitter } from '../types';

export default function LocationsPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { locations, userCoords, radius, setRadius, loading } = useLocations();
  const { likedIds, toggleLike } = useLikes();
  const [searchCity, setSearchCity] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((loc: LocationWithSubmitter) => {
    setSelectedId(loc.id);
  }, []);

  const handleMapClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const filtered = searchCity.trim()
    ? locations.filter((loc) =>
        loc.city.toLowerCase().includes(searchCity.trim().toLowerCase()) ||
        loc.name.toLowerCase().includes(searchCity.trim().toLowerCase()))
    : locations;

  // ── Desktop: side panel + map ──
  if (isDesktop) {
    const selectedLoc = selectedId ? filtered.find((l) => l.id === selectedId) : null;
    const selectedPhoto = selectedLoc?.photos?.[0]?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${selectedLoc.photos[0].storage_path}`
      : null;

    return (
      <div className="flex h-dvh relative">
        {/* Side panel */}
        <div className={`${panelOpen ? 'w-[360px]' : 'w-0'} shrink-0 h-dvh overflow-hidden border-r border-tab-border bg-bg transition-all duration-200`}>
          <div className="w-[360px] h-full flex flex-col">
            {selectedLoc ? (
              <>
                {/* Detail mode */}
                <div className="flex items-center gap-2 p-4 pb-2 border-b border-tab-border">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-8 h-8 grid place-items-center rounded-full hover:bg-surface text-ink-mute hover:text-ink"
                  >
                    ←
                  </button>
                  <span className="text-[13px] font-mono text-ink-mute">Back to list</span>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {selectedPhoto && (
                    <img src={selectedPhoto} alt={selectedLoc.name} className="w-full aspect-[16/9] object-cover bg-surface" />
                  )}
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="font-display font-bold text-[20px] leading-snug text-ink">{selectedLoc.name}</h3>
                      <p className="text-[12px] text-ink-mute font-mono mt-1">{selectedLoc.city}, {selectedLoc.state}{selectedLoc.distance !== undefined ? ` · ${selectedLoc.distance} mi` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-pill font-medium ${
                        selectedLoc.permission_level === 'none' ? 'bg-perm-pub/20 text-perm-pub' :
                        selectedLoc.permission_level === 'low' ? 'bg-perm-mid/20 text-perm-mid' : 'bg-perm-sec/20 text-perm-sec'
                      }`}>
                        ● {selectedLoc.permission_level === 'none' ? 'Public' : selectedLoc.permission_level === 'low' ? 'May need permission' : 'Highly secure'}
                      </span>
                      {selectedLoc.access_fee != null && selectedLoc.access_fee > 0 && (
                        <span className="text-[11px] bg-surface text-ink-mute px-2.5 py-0.5 rounded-pill font-mono border border-chip-border">${selectedLoc.access_fee.toFixed(2)} fee</span>
                      )}
                      {selectedLoc.tags?.map((tag) => (
                        <span key={tag} className="text-[11px] bg-surface text-ink-mute px-2.5 py-0.5 rounded-pill border border-chip-border">#{tag}</span>
                      ))}
                    </div>
                    {selectedLoc.description && (
                      <p className="text-[13px] text-ink/80 leading-relaxed">{selectedLoc.description}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate(`/location/${selectedLoc.id}`)}
                        className="flex-1 h-11 rounded-card bg-accent text-ink font-semibold text-[14px] active:scale-[.98] transition-transform duration-100"
                      >
                        View full details
                      </button>
                      <a
                        href={`https://www.google.com/maps/dir//${selectedLoc.latitude},${selectedLoc.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 rounded-card border border-chip-border px-4 inline-flex items-center gap-2 text-ink-mute hover:bg-surface text-[14px] active:scale-[.98] transition-transform duration-100"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                        Directions
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* List mode */}
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 bg-surface rounded-card px-3.5 py-2.5 border border-chip-border">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="Search city or spot..."
                      className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-dim"
                    />
                  </div>
                  <p className="text-[12px] font-mono text-ink-mute mt-2 px-1">{filtered.length} spots within {radius} mi</p>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[11px] text-ink-dim font-mono">{radius} mi</span>
                    <input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-ink h-1" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (<div key={i} className="bg-surface rounded-card h-20 animate-pulse" />))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-ink-mute"><p className="text-sm">No spots found</p></div>
                  ) : (
                    filtered.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedId(loc.id)}
                        className={`flex items-center gap-3 p-2 rounded-card cursor-pointer transition-colors mb-1 ${selectedId === loc.id ? 'bg-accent/15 border border-accent/30' : 'hover:bg-surface'}`}
                      >
                        {loc.photos?.[0]?.storage_path ? (
                          <img src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${loc.photos[0].storage_path}`} alt="" className="w-12 h-12 rounded object-cover bg-surface shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-surface shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink truncate">{loc.name}</p>
                          <p className="text-[11px] font-mono text-ink-mute">{loc.city}{loc.distance !== undefined ? ` · ${loc.distance} mi` : ''}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); toggleLike(loc.id); }} className={`p-1 ${likedIds.has(loc.id) ? 'text-danger' : 'text-ink-dim'}`}>
                          {likedIds.has(loc.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toggle panel button */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="absolute top-4 z-30 w-8 h-8 grid place-items-center rounded-full bg-surface border border-chip-border text-ink-mute hover:text-ink transition-colors shadow-panel"
          style={{ left: panelOpen ? '372px' : '12px' }}
        >
          {panelOpen ? '◂' : '▸'}
        </button>

        {/* Map */}
        <div className="flex-1 relative">
          {userCoords && (
            <MapView
              locations={filtered}
              center={userCoords}
              fullHeight
              selectedId={selectedId}
              onSelect={handleSelect}
              onClose={handleMapClose}
              suppressPreview
            />
          )}
        </div>
      </div>
    );
  }

  // ── Mobile layout ──
  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface rounded-card px-4 py-2.5 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search city or spot..."
              className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-mute"
            />
          </div>
          <button className="bg-surface rounded-card px-4 py-2.5 text-sm font-medium text-ink">
            Filters
          </button>
        </div>
      </div>

      {/* Results summary */}
      <div className="px-4 py-2 flex items-center justify-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B8AFF" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-[13px] text-ink-mute">
          <strong className="text-ink">{filtered.length}</strong> spots found within {radius} miles.
        </span>
      </div>

      {/* Map */}
      {userCoords && (
        <div className="h-48 mx-4 rounded-card overflow-hidden mb-3">
          <MapView locations={filtered} center={userCoords} />
        </div>
      )}

      {/* Radius */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <span className="text-xs text-ink-mute">{radius} mi</span>
        <input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-ink h-1" />
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface h-[50vh] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-mute">
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

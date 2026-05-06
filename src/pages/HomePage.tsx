import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLocations } from '../hooks/useLocations';
import { useLikes } from '../hooks/useLikes';
import { useNotifications } from '../hooks/useNotifications';
import { useIsDesktop } from '../hooks/useIsDesktop';
import LocationCard from '../components/LocationCard';
import Leaderboard from '../components/Leaderboard';

export default function HomePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { locations, radius, setRadius, loading, refresh } = useLocations();
  const { likedIds, toggleLike } = useLikes();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const filtered = filterTag
    ? locations.filter((loc) => loc.tags?.includes(filterTag))
    : locations;

  const handleRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between lg:px-0 lg:max-w-[680px] lg:mx-auto">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight lg:font-display lg:text-[28px]" style={{ fontFamily: "'Pacifico', cursive" }}>DriftScout</h1>
          {!isDesktop && <span className="text-[9px] text-ink-mute">V1.0</span>}
        </div>
        {/* Mobile header buttons (desktop has these in sidebar) */}
        {!isDesktop && (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/notifications')} className="relative p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/submit')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <div className="px-4 pb-3 flex items-center gap-3 lg:px-0 lg:max-w-[680px] lg:mx-auto">
        <div className="flex-1 bg-surface rounded-card px-4 py-2.5 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/locations')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="text-[15px] text-ink-mute">Search city or spot...</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-surface rounded-card px-4 py-2.5 text-sm font-medium text-ink"
        >
          Filters
        </button>
      </div>

      {/* Results summary */}
      <div className="px-4 py-2 flex items-center justify-center gap-1.5 lg:max-w-[680px] lg:mx-auto">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B8AFF" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-[13px] text-ink-mute">
          <strong className="text-ink">{filtered.length}</strong> spots found within {radius} miles.
          {filterTag && (
            <>
              {' '}<span>· #{filterTag}</span>
              <button onClick={() => setFilterTag(null)} className="ml-1 text-ink-mute hover:text-ink">✕</button>
            </>
          )}
        </span>
      </div>

      {/* Radius */}
      <div className="px-4 pb-3 flex items-center gap-2 lg:max-w-[680px] lg:mx-auto">
        <span className="text-xs text-ink-mute">{radius} mi</span>
        <input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-ink h-1" />
      </div>

      {/* Content: feed + optional leaderboard sidebar */}
      <div className={`lg:flex lg:gap-8 ${isDesktop ? 'lg:max-w-[1100px] lg:mx-auto lg:px-6 lg:py-8' : ''}`}>
        {/* Feed */}
        <div className="px-4 lg:flex-1 lg:max-w-[680px] lg:mx-auto lg:px-0">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface h-[50vh] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-mute">
              <p className="text-lg mb-2">No spots found</p>
              <p className="text-sm">{filterTag ? 'Try removing the tag filter' : 'Try increasing the search radius'}</p>
            </div>
          ) : (
            <>
              {filtered.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  isLiked={likedIds.has(loc.id)}
                  onToggleLike={() => toggleLike(loc.id)}
                  onTagClick={(tag) => setFilterTag(tag)}
                  onClick={() => navigate(`/location/${loc.id}`)}
                />
              ))}
              {/* Leaderboard inline on mobile and narrow desktop */}
              {!isDesktop && (
                <div className="border-t border-tab-border mt-4 pt-4">
                  <Leaderboard />
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard sidebar — wide desktop only */}
        {isDesktop && (
          <div className="hidden xl:block w-[380px] shrink-0">
            <div className="sticky top-8">
              <Leaderboard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

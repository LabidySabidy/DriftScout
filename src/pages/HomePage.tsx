/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLikes } from '../hooks/useLikes';
import { useNotifications } from '../hooks/useNotifications';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { fetchAllLocations } from '../lib/locations';
import LocationCard from '../components/LocationCard';
import Leaderboard from '../components/Leaderboard';
import type { LocationWithSubmitter } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { likedIds, toggleLike } = useLikes();
  const { unreadCount } = useNotifications();
  const [locations, setLocations] = useState<LocationWithSubmitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllLocations();
    setLocations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const filtered = filterTag
    ? locations.filter((loc) => loc.tags?.includes(filterTag))
    : locations;

  // Extract all unique tags from loaded locations, sorted by frequency desc then alphabetically
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    locations.forEach((loc) => {
      loc.tags?.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [locations]);

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between lg:px-0 lg:max-w-[680px] lg:mx-auto">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight lg:font-display lg:text-[28px]" style={{ fontFamily: "'Pacifico', cursive" }}>
            <img src="/logo-icon.png" alt="" className="w-8 h-auto lg:w-10" />
            DriftScout
          </h1>
          {!isDesktop && <span className="text-[9px] text-ink-mute">V1.0</span>}
        </div>
        {/* Mobile header buttons */}
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

      {/* Search bar */}
      <div className="px-4 pb-3 flex items-center gap-3 lg:px-0 lg:max-w-[680px] lg:mx-auto">
        <div className="flex-1 bg-surface rounded-card px-4 py-2.5 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/locations')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="text-[15px] text-ink-mute">Search city or spot...</span>
        </div>
        {allTags.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`bg-surface rounded-card px-4 py-2.5 text-sm font-medium active:scale-[.97] transition-transform duration-100 ${filterTag ? 'text-accent' : 'text-ink'}`}
            >
              {filterTag ? `#${filterTag}` : 'Filter'}
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-bg border border-chip-border rounded-card shadow-panel py-1 max-h-[60vh] overflow-y-auto overscroll-contain">
                  <button
                    onClick={() => { setFilterTag(null); setShowFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-surface transition-colors ${!filterTag ? 'text-accent font-semibold' : 'text-ink-mute'}`}
                  >
                    All spots
                  </button>
                  {allTags.map((tag) => {
                    const active = filterTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => { setFilterTag(active ? null : tag); setShowFilter(false); }}
                        className={`w-full text-left px-3 py-2 text-[13px] hover:bg-surface transition-colors flex items-center justify-between ${active ? 'text-accent font-semibold' : 'text-ink-mute'}`}
                      >
                        <span>#{tag}</span>
                        {active && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
        <button
          onClick={loadLocations}
          className="bg-surface rounded-card px-4 py-2.5 text-sm font-medium text-ink active:scale-[.97] transition-transform duration-100"
        >
          Refresh
        </button>
      </div>

      {/* Content: feed */}
      <div className={`lg:max-w-[1100px] lg:mx-auto lg:px-6 lg:py-8`}>
        <div className="px-4 lg:max-w-[680px] lg:mx-auto lg:px-0">
          {filterTag && (
            <p className="text-[11px] text-ink-mute font-mono mb-3">
              {filtered.length} spot{filtered.length !== 1 ? 's' : ''} tagged <span className="text-accent">#{filterTag}</span>
            </p>
          )}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-surface h-[50vh] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-mute">
              <p className="text-lg mb-2">No spots found</p>
              <p className="text-sm">{filterTag ? 'Try removing the tag filter' : 'Check back soon for new spots'}</p>
            </div>
          ) : (
            filtered.map((loc) => (
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
          {/* Leaderboard — mobile only */}
          {!isDesktop && filtered.length > 0 && (
            <div className="border-t border-tab-border mt-4 pt-4">
              <Leaderboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

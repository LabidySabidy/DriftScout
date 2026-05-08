/* eslint-disable react-hooks/set-state-in-effect */
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useLikes } from '../hooks/useLikes';
import { useNotifications } from '../hooks/useNotifications';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { fetchAllLocations } from '../lib/locations';
import LocationCard from '../components/LocationCard';
import Leaderboard from '../components/Leaderboard';
import ReportBugModal from '../components/ReportBugModal';
import type { LocationWithSubmitter } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { likedIds, toggleLike } = useLikes();
  const { unreadCount } = useNotifications();
  const [locations, setLocations] = useState<LocationWithSubmitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showBugModal, setShowBugModal] = useState(false);

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

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between lg:px-0 lg:max-w-[680px] lg:mx-auto">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight lg:font-display lg:text-[28px]" style={{ fontFamily: "'Pacifico', cursive" }}>
            <img src="/logo-icon.png" alt="" className="w-8 h-auto lg:w-10" />
            DriftScout
            <span className="text-[11px] text-ink-mute font-sans font-normal tracking-normal ml-1">v1.0</span>
          </h1>
        </div>
        {/* Mobile header buttons */}
        {!isDesktop && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBugModal(true)} className="relative p-1">
              <img src="/bug-report.png" alt="Bug" className="w-5 h-5 invert" />
            </button>
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
        {/* Desktop bug button */}
        {isDesktop && (
          <button
            onClick={() => setShowBugModal(true)}
            className="p-2 rounded-full hover:bg-surface transition-colors"
            title="Report a Bug"
          >
            <img src="/bug-report.png" alt="Bug" className="w-5 h-5 invert opacity-60 hover:opacity-100" />
          </button>
        )}
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

      <ReportBugModal open={showBugModal} onClose={() => setShowBugModal(false)} />
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '../hooks/useLocation';
import { useLikes } from '../hooks/useLikes';
import CommunityPhotos from './CommunityPhotos';

interface LocationDrawerProps {
  locationId: string;
  onClose: () => void;
}

const permissionLabels: Record<string, string> = {
  none: 'Public access — no permission needed',
  low: 'May require permission',
  high: 'Highly secure — requires permission',
};

const permissionColors: Record<string, { bg: string; text: string }> = {
  none: { bg: 'bg-perm-pub/20', text: 'text-perm-pub' },
  low: { bg: 'bg-perm-mid/20', text: 'text-perm-mid' },
  high: { bg: 'bg-perm-sec/20', text: 'text-perm-sec' },
};

export default function LocationDrawer({ locationId, onClose }: LocationDrawerProps) {
  const navigate = useNavigate();
  const { location, loading } = useLocation(locationId);
  const { likedIds, toggleLike } = useLikes();

  if (loading) {
    return null; // parent handles loading via backdrop
  }

  if (!location) return null;

  const isLiked = likedIds.has(location.id);
  const photos = location.photos ?? [];
  const permColor = permissionColors[location.permission_level] || permissionColors.none;
  const photoUrl = photos[0]
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${photos[0].storage_path}`
    : null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Drawer */}
      <motion.div
        className="fixed bottom-0 inset-x-0 z-50 bg-bg border-t border-tab-border rounded-t-sheet shadow-sheet flex flex-col overflow-hidden"
        style={{ height: '62dvh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        {/* Drag handle + header */}
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-ink-dim cursor-grab" />
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="font-display font-bold text-[20px] text-ink truncate pr-2">{location.name}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface text-ink-mute shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe">
          {/* Photo */}
          {photoUrl && (
            <img
              src={photoUrl}
              alt={location.name}
              className="w-full aspect-[16/9] object-cover rounded-card bg-surface mb-4"
            />
          )}

          <div className="space-y-4">
            {/* Meta */}
            <div>
              <p className="text-[13px] text-ink-mute font-mono">
                {location.city}, {location.state}
                {location.distance !== undefined && <> · {location.distance} miles away</>}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-pill font-medium ${permColor.bg} ${permColor.text}`}>
                ● {permissionLabels[location.permission_level]}
              </span>
              {location.access_fee != null && location.access_fee > 0 && (
                <span className="text-xs bg-surface text-ink-mute px-3 py-1 rounded-pill font-mono">
                  ${location.access_fee.toFixed(2)} fee
                </span>
              )}
              {location.tags?.map((tag) => (
                <span key={tag} className="text-xs bg-surface text-ink-mute px-3 py-1 rounded-pill border border-chip-border">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Description */}
            {location.description && (
              <p className="text-ink/80 leading-relaxed text-[14px]">{location.description}</p>
            )}

            {/* CTAs */}
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-card bg-accent text-ink font-semibold inline-flex items-center justify-center gap-2 text-[14px] active:scale-[.98] transition-transform duration-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                Directions
              </a>
              <button
                onClick={() => toggleLike(location.id)}
                className={`h-11 rounded-card border border-chip-border px-4 inline-flex items-center justify-center gap-2 hover:bg-surface text-[14px] active:scale-[.98] transition-transform duration-100 ${isLiked ? 'text-danger' : 'text-ink-mute'}`}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button
                onClick={() => { navigate(`/location/${location.id}`); onClose(); }}
                className="h-11 rounded-card border border-chip-border px-4 inline-flex items-center justify-center gap-2 hover:bg-surface text-[14px] text-ink-mute active:scale-[.98] transition-transform duration-100"
              >
                Full page →
              </button>
            </div>

            {/* Submitter */}
            {location.submitter && (
              <div className="flex items-center gap-3 pt-3 border-t border-chip-border">
                {location.submitter.avatar_url && (
                  <img src={location.submitter.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <p className="text-xs font-medium text-ink">{location.submitter.username}</p>
                  <p className="text-[11px] text-ink-mute font-mono">Discovered {new Date(location.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {/* Community photos */}
            <CommunityPhotos locationId={location.id} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

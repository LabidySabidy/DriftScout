import { useNavigate } from 'react-router-dom';
import type { LocationWithSubmitter } from '../types';

interface PinPreviewPopoverProps {
  location: LocationWithSubmitter;
  position: { x: number; y: number };
  onClose: () => void;
  onViewMore?: () => void;
}

const permissionLabels: Record<string, string> = {
  none: 'Public',
  low: 'May need permission',
  high: 'Highly secure',
};

const permissionColors: Record<string, string> = {
  none: 'text-perm-pub',
  low: 'text-perm-mid',
  high: 'text-perm-sec',
};

export default function PinPreviewPopover({ location, position, onClose, onViewMore }: PinPreviewPopoverProps) {
  const navigate = useNavigate();

  const photoUrl = location.photos?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
    : null;

  return (
    <div
      className="fixed z-[9999] w-[320px] rounded-card bg-surface/95 backdrop-blur-xl border border-chip-border shadow-panel overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, calc(-100% - 20px))',
      }}
    >
        {/* Arrow */}
        <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 -translate-x-1/2 rotate-45 bg-surface border-r border-b border-chip-border" />

        {/* Content */}
        <div className="p-3 relative">
          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full hover:bg-surface-2 text-ink-dim hover:text-ink transition-colors z-10"
          >
            ✕
          </button>
          {photoUrl && (
            <img
              src={photoUrl}
              alt={location.name}
              className="w-full aspect-[16/9] object-cover rounded bg-surface-2 mb-3 cursor-pointer"
              onClick={() => { navigate(`/location/${location.id}`); }}
            />
          )}

          <h3 className="font-display font-bold text-[16px] leading-snug text-ink mb-1">
            {location.name}
          </h3>
          <p className="text-[12px] text-ink-mute font-mono mb-2">
            {location.city}, {location.state}
            {location.distance !== undefined && <> · {location.distance} miles away</>}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mb-3">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-pill font-medium ${permissionColors[location.permission_level]}`}>
              ● {permissionLabels[location.permission_level]}
            </span>
            {location.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] bg-surface-2 text-ink-mute px-2 py-0.5 rounded-pill border border-chip-border">
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (onViewMore) {
                  onViewMore();
                } else {
                  navigate(`/location/${location.id}`);
                }
              }}
              className="flex-1 h-9 rounded-card bg-accent text-ink font-semibold text-[12px] active:scale-[.98] transition-transform duration-100"
            >
              View details
            </button>
            <a
              href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 rounded-card bg-accent/20 border border-accent/40 px-3 inline-flex items-center gap-1.5 text-accent font-semibold hover:bg-accent/30 text-[12px] active:scale-[.98] transition-all duration-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
              Directions
            </a>
          </div>
        </div>
      </div>
  );
}

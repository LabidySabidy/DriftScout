import { useNavigate } from 'react-router-dom';
import type { LocationWithSubmitter } from '../types';

interface PinPreviewSheetProps {
  location: LocationWithSubmitter;
  onClose: () => void;
}

const permissionLabels: Record<string, string> = {
  none: 'Public',
  low: 'May need permission',
  high: 'Highly secure',
};

const permissionColors: Record<string, string> = {
  none: 'bg-perm-pub/15 text-perm-pub',
  low: 'bg-perm-mid/15 text-perm-mid',
  high: 'bg-perm-sec/15 text-perm-sec',
};

export default function PinPreviewSheet({ location, onClose }: PinPreviewSheetProps) {
  const navigate = useNavigate();

  const photoUrl = location.photos?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
    : null;

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40"
        onClick={onClose}
      />

      {/* Static panel pinned above tab bar */}
      <div className="fixed inset-x-0 bottom-[72px] z-[9999] bg-surface/95 backdrop-blur-xl border-t border-chip-border rounded-t-card rounded-b-card px-4 pt-4 pb-6 shadow-sheet">
        <div className="flex gap-3">
          {/* Photo */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={location.name}
              className="w-[72px] h-[72px] rounded object-cover bg-surface shrink-0 cursor-pointer active:scale-[.97] transition-transform"
              onClick={() => { navigate(`/location/${location.id}`); onClose(); }}
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded bg-surface shrink-0" />
          )}

          {/* Details */}
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-[16px] leading-snug text-ink truncate">
              {location.name}
            </h3>
            <p className="text-[12px] text-ink-mute font-mono mt-0.5">
              {location.city}, {location.state}
              {location.distance !== undefined && <> · {location.distance} mi</>}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-pill font-medium ${permissionColors[location.permission_level]}`}>
                ● {permissionLabels[location.permission_level]}
              </span>
              {location.access_fee != null && location.access_fee > 0 && (
                <span className="text-[10px] text-ink-mute px-2 py-0.5 rounded-pill border border-chip-border font-mono">
                  ${location.access_fee.toFixed(2)}
                </span>
              )}
              {location.tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] text-ink-mute px-2 py-0.5 rounded-pill border border-chip-border">
                  #{tag}
                </span>
              ))}
              {location.tags && location.tags.length > 2 && (
                <span className="text-[10px] text-ink-dim px-2 py-0.5">+{location.tags.length - 2}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => { navigate(`/location/${location.id}`); onClose(); }}
            className="flex-1 h-11 rounded-card bg-accent text-ink font-semibold text-[14px] active:scale-[.98] transition-transform duration-100"
          >
            View details
          </button>
          <a
            href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 rounded-card border border-chip-border px-5 inline-flex items-center justify-center gap-2 text-ink-mute active:scale-[.98] transition-transform duration-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
            </svg>
            Directions
          </a>
        </div>
      </div>
    </>
  );
}

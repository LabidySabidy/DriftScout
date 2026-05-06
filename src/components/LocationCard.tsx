import type { LocationWithSubmitter } from '../types';

interface LocationCardProps {
  location: LocationWithSubmitter;
  onClick?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onTagClick?: (tag: string) => void;
}

const permissionLabels: Record<string, string> = {
  none: 'Public',
  low: 'May need permission',
  high: 'Highly secure',
};

export default function LocationCard({ location, onClick, isLiked, onToggleLike, onTagClick }: LocationCardProps) {
  const photoUrl =
    location.photos?.[0]?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
      : null;

  return (
    <div className="mb-4 cursor-pointer" onClick={onClick}>
      {/* User row */}
      {location.submitter && (
        <div className="flex items-center gap-3 px-4 py-2">
          {location.submitter.avatar_url ? (
            <img src={location.submitter.avatar_url} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-input-fill" />
          )}
          <span className="text-sm font-semibold text-white">{location.submitter.username}</span>
        </div>
      )}

      {/* Full-bleed image */}
      {photoUrl ? (
        <img src={photoUrl} alt={location.name} className="w-full object-cover" style={{ aspectRatio: '4/5', maxHeight: '65vh' }} loading="lazy" />
      ) : (
        <div className="w-full bg-input-fill flex items-center justify-center text-muted text-sm" style={{ aspectRatio: '4/5', maxHeight: '65vh' }}>
          No photo
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLike?.(); }}
            className="p-2 -ml-2"
          >
            {isLiked ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.share?.({
                title: location.name,
                url: `/location/${location.id}`,
              }).catch(() => {});
            }}
            className="p-2 -ml-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          </button>
        </div>
        <a
          href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[13px] font-semibold text-white bg-directions px-4 py-1.5 rounded-2xl"
        >
          Directions
        </a>
      </div>

      {/* Title + meta */}
      <div className="px-4 pb-1">
        <h3 className="text-base font-bold text-white">{location.name}</h3>
        <p className="text-xs text-muted mt-0.5">
          Discovered {new Date(location.created_at).toLocaleDateString()}
        </p>
        <p className="text-xs text-muted">
          {location.distance !== undefined && <>{location.distance} miles away in </>}
          <span className="text-accent-link underline cursor-pointer hover:text-accent-link/80">
            {location.city}
          </span>
        </p>
        {location.access_fee != null && location.access_fee > 0 && (
          <p className="text-xs text-muted">${location.access_fee.toFixed(2)} access fee</p>
        )}
        {location.permission_level !== 'none' && (
          <p className="text-xs text-muted mt-0.5">{permissionLabels[location.permission_level]}</p>
        )}
      </div>

      {/* Tags */}
      {location.tags && location.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {location.tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
              className="text-[11px] font-medium text-[#CCCCCC] bg-input-fill border border-chip-border rounded-full px-3 py-1 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

import { useIsDesktop } from '../hooks/useIsDesktop';
import ImageWithFade from './ImageWithFade';
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

const permissionColors: Record<string, string> = {
  none: 'text-perm-pub',
  low: 'text-perm-mid',
  high: 'text-perm-sec',
};

export default function LocationCard({ location, onClick, isLiked, onToggleLike, onTagClick }: LocationCardProps) {
  const isDesktop = useIsDesktop();
  const photoUrl =
    location.photos?.[0]?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
      : null;

  const headerRow = (
    <div className="flex items-center gap-3 px-4 mb-2.5 lg:p-4 lg:pb-3 lg:mb-0">
      {location.submitter?.avatar_url ? (
        <img src={location.submitter.avatar_url} alt="" className="w-8 h-8 rounded-full bg-surface object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-surface shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink leading-tight">{location.submitter?.username}</p>
        <p className="text-[11px] text-ink-mute font-mono leading-tight mt-0.5">
          {location.distance !== undefined ? `${location.distance} miles` : ''}
        </p>
      </div>
    </div>
  );

  const photoSection = photoUrl ? (
    <ImageWithFade
      src={photoUrl}
      alt={location.name}
      loading="lazy"
      style={{ aspectRatio: isDesktop ? '3/2' : '4/5', maxHeight: isDesktop ? undefined : '65vh' }}
    />
  ) : (
    <div
      className="w-full bg-surface flex items-center justify-center text-ink-mute text-sm"
      style={{ aspectRatio: isDesktop ? '3/2' : '4/5', maxHeight: isDesktop ? undefined : '65vh' }}
    >
      No photo
    </div>
  );

  const actionRow = (
    <div className="flex items-center gap-4 px-4 pt-3 pb-1 lg:px-4 lg:pt-3 lg:pb-1">
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLike?.(); }}
        className={`p-1 -m-1 active:scale-90 transition-transform ${isLiked ? 'animate-[heart-pop_220ms_ease-out]' : ''}`}
      >
        {isLiked ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="1.75"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
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
        className="p-1 -m-1 active:scale-90 transition-transform"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
      </button>
      <a
        href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="ml-auto inline-flex items-center gap-1.5 rounded-pill bg-accent/20 border border-accent/40 px-3.5 py-1.5 text-[12px] font-semibold text-accent hover:bg-accent/30 active:scale-[.97] transition-all duration-100"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
        Directions
      </a>
    </div>
  );

  const captionBlock = (
    <div className="px-4 pt-1 pb-3 space-y-2 lg:p-4 lg:pt-2">
      <h3 className="font-display font-bold text-[17px] leading-snug text-ink">{location.name}</h3>
      <p className="text-accent text-[13px] underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
        {location.city}
      </p>
      <p className="text-ink-mute text-[12px] font-mono">
        {location.distance !== undefined && <>{location.distance} miles away</>}
        {location.access_fee != null && location.access_fee > 0 && (
          <> · ${location.access_fee.toFixed(2)} fee</>
        )}
      </p>
      {location.permission_level !== 'none' && (
        <p className={`text-[12px] font-mono ${permissionColors[location.permission_level]}`}>
          ● {permissionLabels[location.permission_level]}
        </p>
      )}
      {location.tags && location.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {location.tags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
              className="inline-flex items-center gap-1 rounded-pill border border-chip-border bg-surface px-2.5 py-0.5 text-[11px] text-ink-mute cursor-pointer active:scale-[.97] transition-transform duration-100"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="block cursor-pointer mb-6 -mx-4 first:mt-0 lg:mx-0 lg:rounded-card lg:border lg:border-chip-border lg:bg-surface lg:overflow-hidden lg:hover:border-accent/40 lg:transition-colors lg:mb-6"
      onClick={onClick}
    >
      {headerRow}
      {photoSection}
      {actionRow}
      {captionBlock}
    </div>
  );
}

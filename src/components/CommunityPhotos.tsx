import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface LocationPhoto {
  id: string;
  location_id: string;
  storage_path: string;
  created_at: string;
}

interface CommunityPhotosProps {
  locationId: string;
  onPhotoClick?: (photoUrl: string) => void;
  canDelete?: boolean;
  onDelete?: (photoId: string) => void;
}

export default function CommunityPhotos({ locationId, onPhotoClick, canDelete, onDelete }: CommunityPhotosProps) {
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPhotos = useCallback(() => {
    supabase
      .from('location_photos')
      .select('*')
      .eq('location_id', locationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setPhotos(data as LocationPhoto[]);
        setLoading(false);
      });
  }, [locationId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  if (loading) {
    return (
      <div className="pt-2">
        <h4 className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-2">
          Community Photos
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) return null;

  const displayPhotos = expanded ? photos : photos.slice(0, 4);
  const hasMore = photos.length > 4;

  const photoUrl = (photo: LocationPhoto) =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${photo.storage_path}`;

  return (
    <div className="pt-2">
      <h4 className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-2">
        Community Photos ({photos.length})
      </h4>
      <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-6">
        {displayPhotos.map((photo) => (
          <div key={photo.id} className="aspect-square rounded bg-surface relative group">
            <img
              src={photoUrl(photo)}
              alt=""
              className="w-full h-full rounded object-cover cursor-pointer group-hover:opacity-80 transition-opacity"
              loading="lazy"
              onClick={() => onPhotoClick?.(photoUrl(photo))}
            />
            {canDelete && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setDeleting(photo.id);
                  await onDelete?.(photo.id);
                  setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
                  setDeleting(null);
                }}
                disabled={deleting === photo.id}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-ink flex items-center justify-center text-[13px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/80 active:scale-[.97]"
                title="Delete photo"
              >
                {deleting === photo.id ? (
                  <span className="w-3 h-3 border border-ink border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  '✕'
                )}
              </button>
            )}
          </div>
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="aspect-square rounded bg-surface flex items-center justify-center text-ink-mute text-[11px] font-mono hover:bg-surface-2 transition-colors"
          >
            +{photos.length - 4}
          </button>
        )}
      </div>
      {expanded && hasMore && (
        <button
          onClick={() => setExpanded(false)}
          className="text-[11px] text-accent font-mono mt-2 hover:text-accent-hi"
        >
          Show less
        </button>
      )}
    </div>
  );
}

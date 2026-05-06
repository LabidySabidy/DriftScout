import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LocationPhoto {
  id: string;
  location_id: string;
  storage_path: string;
  created_at: string;
}

interface CommunityPhotosProps {
  locationId: string;
}

export default function CommunityPhotos({ locationId }: CommunityPhotosProps) {
  const [photos, setPhotos] = useState<LocationPhoto[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          <img
            key={photo.id}
            src={photoUrl(photo)}
            alt=""
            className="aspect-square rounded bg-surface object-cover"
            loading="lazy"
          />
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

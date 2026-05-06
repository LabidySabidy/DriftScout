import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  none: 'text-perm-pub',
  low: 'text-perm-mid',
  high: 'text-perm-sec',
};

const PEEK = 220;
const MID = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400;
const FULL = typeof window !== 'undefined' ? window.innerHeight * 0.78 : 600;
const MAX_UP_DRAG = typeof window !== 'undefined' ? -(window.innerHeight - 160) : -600;

const DETENTS = [PEEK, MID, FULL];

export default function PinPreviewSheet({ location, onClose }: PinPreviewSheetProps) {
  const navigate = useNavigate();
  const [height, setHeight] = useState(PEEK);

  const photoUrl = location.photos?.[0]?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${location.photos[0].storage_path}`
    : null;

  const handleDrag = useCallback((_: unknown, info: { offset: { y: number } }) => {
    // offset.y is negative when dragging up, positive when dragging down
    const newHeight = Math.max(PEEK, Math.min(FULL, PEEK - info.offset.y));
    setHeight(newHeight);
  }, []);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    const vy = info.velocity.y;
    const currentHeight = PEEK - info.offset.y;

    // Dismiss on strong downward swipe
    if (vy > 500 || (currentHeight < PEEK + 40 && info.offset.y > 40)) {
      onClose();
      return;
    }

    // Snap to nearest detent
    let closest = PEEK;
    let minDist = Infinity;
    for (const d of DETENTS) {
      const dist = Math.abs(currentHeight - d);
      if (dist < minDist) {
        minDist = dist;
        closest = d;
      }
    }
    setHeight(closest);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[9999] bg-surface/95 backdrop-blur-xl border-t border-chip-border rounded-t-sheet shadow-sheet flex flex-col"
        initial={{ height: PEEK }}
        animate={{ height }}
        exit={{ height: PEEK, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        drag="y"
        dragConstraints={{ top: MAX_UP_DRAG, bottom: 600 }}
        dragElastic={0}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0">
          <div className="w-9 h-1 rounded-full bg-ink-dim" />
        </div>

        {/* Content — clipped by parent height, reveals naturally as sheet grows */}
        <div className="flex-1 overflow-hidden pb-safe px-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={location.name}
              className="w-full aspect-[16/9] object-cover rounded-card bg-surface mt-1"
            />
          )}

          <div className="mt-3 space-y-2">
            <h3 className="font-display font-bold text-[20px] leading-snug text-ink">{location.name}</h3>
            <p className="text-[13px] text-ink-mute font-mono">
              {location.city}, {location.state}
              {location.distance !== undefined && <> · {location.distance} miles away</>}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-pill font-medium ${permissionColors[location.permission_level]}`}>
                ● {permissionLabels[location.permission_level]}
              </span>
              {location.access_fee != null && location.access_fee > 0 && (
                <span className="text-[11px] bg-surface text-ink-mute px-2.5 py-0.5 rounded-pill border border-chip-border font-mono">
                  ${location.access_fee.toFixed(2)} fee
                </span>
              )}
              {location.tags?.map((tag) => (
                <span key={tag} className="text-[11px] bg-surface text-ink-mute px-2.5 py-0.5 rounded-pill border border-chip-border">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2 pb-4">
              <button
                onClick={() => {
                  navigate(`/location/${location.id}`);
                  onClose();
                }}
                className="flex-1 h-11 rounded-card bg-accent text-ink font-semibold text-[14px] active:scale-[.98] transition-transform duration-100"
              >
                View details
              </button>
              <a
                href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 rounded-card border border-chip-border px-5 inline-flex items-center justify-center gap-2 text-ink-mute hover:bg-surface text-[14px] active:scale-[.98] transition-transform duration-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
                </svg>
                Directions
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

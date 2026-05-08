import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from '../hooks/useLocation';
import { useLikes } from '../hooks/useLikes';
import { useComments } from '../hooks/useComments';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { usePhotoContribution } from '../hooks/usePhotoContribution';
import CommunityPhotos from '../components/CommunityPhotos';
import { supabase } from '../lib/supabase';
import type { LocationPhoto } from '../types';

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

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { location, loading } = useLocation(id!);
  const { likedIds, toggleLike } = useLikes();
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(id!);
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const { submitReport, submitting: reportSubmitting } = useReports(id!);
  const { uploadPhoto, uploading: photoUploading } = usePhotoContribution();
  const addPhotoRef = useRef<HTMLInputElement>(null);
  const [communityPhotos, setCommunityPhotos] = useState<LocationPhoto[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Compute photos early so hooks can reference them
  const photos = location?.photos ?? [];
  const allPhotos = communityPhotos.length > 0 ? communityPhotos : photos;

  // Keyboard navigation for lightbox (must be before early returns)
  useEffect(() => {
    if (!lightboxOpen || allPhotos.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPhotoIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length);
      if (e.key === 'ArrowRight') setPhotoIndex((i) => (i + 1) % allPhotos.length);
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, allPhotos.length]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-dvh bg-bg text-ink flex flex-col items-center justify-center p-6">
        <p className="text-lg mb-4">Location not found</p>
        <button onClick={() => navigate('/')} className="text-ink-mute underline">
          Go back
        </button>
      </div>
    );
  }

  const isLiked = likedIds.has(location.id);
  const photoUrl = allPhotos[photoIndex]
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${allPhotos[photoIndex].storage_path}`
    : null;

  const permColor = permissionColors[location.permission_level] || permissionColors.none;

  // ── Carousel ──
  const carousel = (
    <div className={`relative bg-surface ${isDesktop ? 'h-[420px]' : 'aspect-[4/3]'}`}>
      {photoUrl ? (
        <motion.img
          src={photoUrl}
          alt={location.name}
          className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -30 && photoIndex < allPhotos.length - 1) {
              setPhotoIndex((i) => i + 1);
            } else if (info.offset.x > 30 && photoIndex > 0) {
              setPhotoIndex((i) => i - 1);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-ink-mute">No photo</div>
      )}
      {allPhotos.length > 1 && (
        <>
          <button
            onClick={() => setPhotoIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-ink active:scale-[.97] transition-transform duration-100"
          >
            ←
          </button>
          <button
            onClick={() => setPhotoIndex((i) => (i + 1) % allPhotos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-ink active:scale-[.97] transition-transform duration-100"
          >
            →
          </button>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {allPhotos.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIndex ? 'bg-ink' : 'bg-ink/40'}`} />
            ))}
          </div>
        </>
      )}
      {/* Add photo pill */}
      <div className="absolute bottom-3 right-3">
        <input
          ref={addPhotoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file && id) {
              const uploaded = await uploadPhoto(id, file);
              if (uploaded) {
                setCommunityPhotos((prev) => [...prev, uploaded]);
              }
            }
            e.target.value = '';
          }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); addPhotoRef.current?.click(); }}
          disabled={photoUploading}
          className="inline-flex items-center gap-1.5 rounded-pill bg-bg/70 backdrop-blur-md border border-white/15 px-3 py-1.5 text-[12px] text-ink hover:bg-bg/90 active:scale-[.97] transition-transform duration-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {photoUploading ? 'Adding...' : 'Add photo'}
        </button>
      </div>
    </div>
  );

  // ── Content block ──
  const contentBlock = (
    <div className="px-4 py-4 space-y-5 lg:px-5">
      {/* Title + meta */}
      <div>
        <h1 className="font-display font-bold text-[26px] leading-[1.1] tracking-tight text-ink">{location.name}</h1>
        <p className="text-[12px] text-ink-mute font-mono mt-1">
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

      {/* CTA buttons */}
      <div className="flex gap-2">
        <a
          href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-12 rounded-card bg-accent text-ink font-semibold inline-flex items-center justify-center gap-2 active:scale-[.98] transition-transform duration-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          Directions
        </a>
        <button
          onClick={() => toggleLike(location.id)}
          className={`h-12 rounded-card border border-chip-border px-5 inline-flex items-center justify-center gap-2 hover:bg-surface active:scale-[.98] transition-transform duration-100 ${isLiked ? 'text-danger' : 'text-ink-mute'}`}
        >
          {isLiked ? '❤️' : '🤍'}
          {isLiked ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Submitter */}
      {location.submitter && (
        <div
          onClick={() => navigate(`/profile/${location.submitter_id}`)}
          className="flex items-center gap-3 pt-4 border-t border-chip-border cursor-pointer active:scale-[.98] transition-transform"
        >
          {location.submitter.avatar_url ? (
            <img src={location.submitter.avatar_url} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface" />
          )}
          <div>
            <p className="text-[10px] uppercase tracking-[.08em] text-ink-mute font-mono">Discovered by</p>
            <p className="text-sm font-medium text-ink">{location.submitter.username}</p>
            <p className="text-xs text-ink-mute">{new Date(location.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Actions row */}
      <div className="flex gap-3">
        <button onClick={() => setShowReport(!showReport)} className="text-xs text-ink-mute hover:text-ink font-mono">
          ⚑ Report
        </button>
        {user?.id === location.submitter_id && location.moderation_status !== 'rejected' && (
          <>
            <button
              onClick={() => navigate(`/submit?edit=${location.id}`)}
              className="text-xs text-accent hover:text-accent-hi font-mono"
            >
              ✎ Edit
            </button>
            <button
              onClick={async () => {
                await supabase.from('locations').update({ moderation_status: 'rejected' }).eq('id', location.id);
                navigate('/', { replace: true });
              }}
              className="text-xs text-danger hover:text-perm-sec font-mono"
            >
              ✕ Remove
            </button>
          </>
        )}
      </div>

      {/* Report form */}
      {showReport && (
        <div className="p-3 bg-surface rounded-card space-y-2">
          <p className="text-sm text-ink-mute">Report this spot</p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full bg-surface rounded px-3 py-2 text-sm text-ink border border-chip-border"
          >
            <option value="">Select reason</option>
            <option value="inaccurate">Inaccurate info</option>
            <option value="unsafe">Unsafe conditions</option>
            <option value="private_property">Private property</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            value={reportDetail}
            onChange={(e) => setReportDetail(e.target.value)}
            placeholder="Details (optional)"
            className="w-full bg-surface rounded px-3 py-2 text-sm text-ink outline-none border border-chip-border focus:border-accent"
          />
          <button
            onClick={() => { submitReport(reportReason, reportDetail); setShowReport(false); }}
            disabled={!reportReason || reportSubmitting}
            className="bg-danger text-ink text-sm px-4 py-1.5 rounded font-medium disabled:opacity-40 active:scale-[.97] transition-transform duration-100"
          >
            Submit Report
          </button>
        </div>
      )}

      {/* Community photos */}
      <CommunityPhotos
        locationId={id!}
        canDelete={user?.id === location.submitter_id}
        onDelete={async (photoId) => {
          // Find the photo record to get its storage path
          const photo = communityPhotos.find(p => p.id === photoId) ?? allPhotos.find(p => p.id === photoId);
          if (photo) {
            await supabase.storage.from('location-photos').remove([photo.storage_path]);
          }
          await supabase.from('location_photos').delete().eq('id', photoId);
          setCommunityPhotos(prev => prev.filter(p => p.id !== photoId));
        }}
        onPhotoClick={(url) => {
          const idx = allPhotos.findIndex(
            (p) => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${p.storage_path}` === url
          );
          if (idx !== -1) {
            setPhotoIndex(idx);
            setLightboxOpen(true);
          }
        }}
      />

      {/* Comments */}
      <div className="pt-4 border-t border-chip-border">
        <h3 className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-3">
          Comments ({comments.length})
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a note about this spot..."
            className="flex-1 h-11 rounded-card bg-surface border border-chip-border px-3.5 text-[14px] text-ink outline-none placeholder:text-ink-dim focus:border-accent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentText.trim()) {
                addComment(commentText);
                setCommentText('');
              }
            }}
          />
          <button
            onClick={() => { addComment(commentText); setCommentText(''); }}
            disabled={!commentText.trim()}
            className="h-11 rounded-card bg-accent text-ink text-sm px-5 font-semibold disabled:opacity-40 active:scale-[.97] transition-transform duration-100"
          >
            Post
          </button>
        </div>

        {commentsLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-surface rounded-card h-10 animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-ink-mute text-center py-4">No comments yet</p>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                {c.user?.avatar_url && (
                  <img src={c.user.avatar_url} alt="" className="w-6 h-6 rounded-full mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-ink">{c.user?.username}</span>
                    <span className="text-xs text-ink-mute">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-ink/80">{c.body}</p>
                </div>
                {user?.id === c.user_id && (
                  <button onClick={() => deleteComment(c.id)} className="text-xs text-ink-mute hover:text-danger shrink-0">✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Lightbox (full-screen photo viewer) ──
  const lightbox = lightboxOpen && photoUrl ? (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
      {/* Close */}
      <button
        onClick={() => setLightboxOpen(false)}
        className="absolute top-4 right-4 z-10 w-10 h-10 grid place-items-center rounded-full bg-black/50 text-ink hover:bg-black/70 transition-colors"
      >
        ✕
      </button>
      {/* Photo count */}
      {allPhotos.length > 1 && (
        <span className="absolute top-4 left-4 z-10 text-[13px] font-mono text-ink/70 bg-black/50 px-3 py-1 rounded-pill">
          {photoIndex + 1} / {allPhotos.length}
        </span>
      )}
      {/* Previous */}
      {allPhotos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 grid place-items-center rounded-full bg-black/50 text-ink hover:bg-black/70 transition-colors text-2xl"
        >
          ‹
        </button>
      )}
      {/* Next */}
      {allPhotos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setPhotoIndex((i) => (i + 1) % allPhotos.length); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 grid place-items-center rounded-full bg-black/50 text-ink hover:bg-black/70 transition-colors text-2xl"
        >
          ›
        </button>
      )}
      {/* Image */}
      <motion.img
        src={photoUrl}
        alt={location.name}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -40 && photoIndex < allPhotos.length - 1) {
            setPhotoIndex((i) => i + 1);
          } else if (info.offset.x > 40 && photoIndex > 0) {
            setPhotoIndex((i) => i - 1);
          }
        }}
      />
    </div>
  ) : null;

  // ── Desktop: slide-in panel ──
  if (isDesktop) {
    return (
      <>
        {lightbox}
        {/* Backdrop */}
        <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" onClick={() => navigate(-1)} />
        {/* Panel */}
        <div className="fixed top-0 right-0 bottom-0 w-[66vw] max-w-[100vw] bg-bg border-l border-tab-border shadow-panel z-50 flex flex-col animate-[panel-in_320ms_cubic-bezier(.32,.72,0,1)_both]">
          {/* Close + header */}
          <div className="sticky top-0 z-10 h-12 px-3 flex items-center gap-2 bg-bg/85 backdrop-blur-xl border-b border-tab-border shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface text-ink-mute hover:text-ink absolute right-3"
            >
              ✕
            </button>
            <span className="text-[13px] font-mono text-ink-mute px-1">Details</span>
          </div>
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {carousel}
            {contentBlock}
          </div>
        </div>
      </>
    );
  }

  // ── Mobile: back button dismiss ──
  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      {lightbox}
      {/* Sticky header */}
      <div className="sticky top-0 z-[10000] h-12 px-3 flex items-center gap-2 bg-bg/85 backdrop-blur-xl border-b border-tab-border">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 h-10 -ml-2 px-2 rounded-full hover:bg-surface text-ink-mute active:scale-[.97] transition-transform duration-100">
          <span className="grid place-items-center">←</span>
          <span className="text-[13px] font-mono">Back</span>
        </button>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {carousel}
        {contentBlock}
      </div>
    </div>
  );
}

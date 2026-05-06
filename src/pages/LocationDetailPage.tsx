import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useLikes } from '../hooks/useLikes';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';

const permissionLabels: Record<string, string> = {
  none: 'Public access — no permission needed',
  low: 'May require permission',
  high: 'Highly secure — requires permission',
};

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location, loading } = useLocation(id!);
  const { likedIds, toggleLike } = useLikes();
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(id!);
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-lg mb-4">Location not found</p>
        <button onClick={() => navigate('/')} className="text-zinc-400 underline">
          Go back
        </button>
      </div>
    );
  }

  const isLiked = likedIds.has(location.id);
  const photos = location.photos ?? [];
  const photoUrl = photos[photoIndex]
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/location-photos/${photos[photoIndex].storage_path}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Photo carousel */}
      {photoUrl ? (
        <div className="relative h-72 bg-zinc-900">
          <img
            src={photoUrl}
            alt={location.name}
            className="w-full h-full object-cover"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ←
              </button>
              <button
                onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center"
              >
                →
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="h-48 bg-zinc-900 flex items-center justify-center text-zinc-600">
          No photo
        </div>
      )}

      {/* Back + actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleLike(location.id)}
            className={`text-2xl ${isLiked ? 'text-red-500' : 'text-zinc-500'}`}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
          <a
            href={`https://www.google.com/maps/dir//${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg"
          >
            Directions
          </a>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-8">
        <h1 className="text-2xl font-bold mb-1">{location.name}</h1>
        <p className="text-zinc-400 mb-4">
          {location.city}, {location.state}
          {location.distance !== undefined && <> · {location.distance} miles away</>}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full ${
            location.permission_level === 'none'
              ? 'bg-green-900 text-green-300'
              : location.permission_level === 'low'
              ? 'bg-yellow-900 text-yellow-300'
              : 'bg-red-900 text-red-300'
          }`}>
            {permissionLabels[location.permission_level]}
          </span>

          {location.access_fee != null && location.access_fee > 0 && (
            <span className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
              ${location.access_fee.toFixed(2)} access fee
            </span>
          )}

          {location.tags?.map((tag) => (
            <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* Description */}
        {location.description && (
          <p className="text-zinc-300 mb-4 leading-relaxed">{location.description}</p>
        )}

        {/* Submitter */}
        {location.submitter && (
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
            {location.submitter.avatar_url && (
              <img
                src={location.submitter.avatar_url}
                alt={location.submitter.username}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium">{location.submitter.username}</p>
              <p className="text-xs text-zinc-500">
                Discovered {new Date(location.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="pt-4 mt-4 border-t border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">
            Comments ({comments.length})
          </h3>

          {/* Add comment */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a note about this spot..."
              className="flex-1 bg-zinc-900 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
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
              className="bg-white text-black text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-40"
            >
              Post
            </button>
          </div>

          {/* Comment list */}
          {commentsLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-lg h-10 animate-pulse" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-zinc-600 text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 items-start">
                  {c.user?.avatar_url && (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.username}
                      className="w-6 h-6 rounded-full mt-0.5 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium">{c.user?.username}</span>
                      <span className="text-xs text-zinc-600">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{c.body}</p>
                  </div>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-xs text-zinc-600 hover:text-red-400 shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

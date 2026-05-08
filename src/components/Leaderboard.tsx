import { useNavigate } from 'react-router-dom';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useFollows } from '../hooks/useFollows';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { entries, loading } = useLeaderboard();
  const { following, toggleFollow } = useFollows();

  if (loading) {
    return (
      <div className="px-4 py-4">
        <h3 className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-3">Top Scouts</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-card h-12 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const crowns = ['👑', '🥈', '🥉'];

  return (
    <div className="px-4 py-4">
      <h3 className="text-[11px] uppercase tracking-[.08em] text-ink-mute font-mono mb-3">Top Scouts</h3>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div
            key={entry.submitter.id}
            onClick={() => navigate(`/profile/${entry.submitter.id}`)}
            className="flex items-center gap-3 py-2 px-3 rounded-card hover:bg-surface transition-colors cursor-pointer active:scale-[.98]"
          >
            <span className="text-sm font-mono text-ink-mute w-5 shrink-0">
              {i < 3 ? crowns[i] : i + 1}
            </span>
            {entry.submitter.avatar_url && (
              <img
                src={entry.submitter.avatar_url}
                alt={entry.submitter.username}
                className="w-8 h-8 rounded-full shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-ink">
                {entry.submitter.username}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFollow(entry.submitter.id); }}
              className={`text-xs px-2 py-0.5 rounded-pill font-medium active:scale-[.97] transition-transform duration-100 ${
                following.has(entry.submitter.id)
                  ? 'bg-ink text-bg'
                  : 'bg-surface text-ink-mute border border-chip-border'
              }`}
            >
              {following.has(entry.submitter.id) ? 'Following' : 'Follow'}
            </button>
            <span className="text-xs text-ink-mute font-mono shrink-0">
              {entry.spot_count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

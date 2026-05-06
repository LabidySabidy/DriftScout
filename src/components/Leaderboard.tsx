import { useLeaderboard } from '../hooks/useLeaderboard';

export default function Leaderboard() {
  const { entries, loading } = useLeaderboard();

  if (loading) {
    return (
      <div className="px-4 py-4">
        <h3 className="text-lg font-semibold mb-3">Top Scouts</h3>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg h-12 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const crowns = ['👑', '🥈', '🥉'];

  return (
    <div className="px-4 py-4">
      <h3 className="text-lg font-semibold mb-3">Top Scouts</h3>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div
            key={entry.submitter.id}
            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/50"
          >
            <span className="text-sm font-mono text-zinc-500 w-5">
              {i < 3 ? crowns[i] : i + 1}
            </span>
            {entry.submitter.avatar_url && (
              <img
                src={entry.submitter.avatar_url}
                alt={entry.submitter.username}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.submitter.username}
              </p>
            </div>
            <span className="text-xs text-zinc-400 shrink-0">
              {entry.spot_count} spot{entry.spot_count !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

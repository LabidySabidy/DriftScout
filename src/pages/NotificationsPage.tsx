import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

const typeLabels: Record<string, string> = {
  like: 'liked your spot',
  comment: 'commented on your spot',
  follow: 'started following you',
  location_status: 'updated spot status',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, markAllRead } = useNotifications();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-sm text-zinc-400">← Back</button>
        <h1 className="text-lg font-semibold">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-zinc-400 hover:text-white">
          Mark all read
        </button>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg h-14 animate-pulse" />
          ))}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-1">No notifications yet</p>
            <p className="text-sm">Likes, comments, and follows will show up here</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => n.location_id && navigate(`/location/${n.location_id}`)}
              className={`flex items-center gap-3 py-3 border-b border-zinc-800/50 cursor-pointer ${!n.read ? 'bg-white/5 -mx-4 px-4' : ''}`}
            >
              {n.actor?.avatar_url && (
                <img src={n.actor.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{n.actor?.username || 'Someone'}</span>{' '}
                  <span className="text-zinc-400">{typeLabels[n.type] || n.type}</span>
                </p>
                <p className="text-xs text-zinc-600">
                  {new Date(n.created_at).toLocaleDateString()}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-white shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

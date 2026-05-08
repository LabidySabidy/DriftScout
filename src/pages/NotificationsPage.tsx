import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useIsDesktop } from '../hooks/useIsDesktop';

const typeLabels: Record<string, string> = {
  like: 'liked your spot',
  comment: 'commented on your spot',
  follow: 'started following you',
  location_status: 'updated spot status',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { notifications, loading, markAllRead, markOneRead } = useNotifications();

  const listContent = loading ? (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-surface rounded-lg h-14 animate-pulse" />
      ))}
    </div>
  ) : notifications.length === 0 ? (
    <div className="text-center py-16 text-ink-mute">
      <p className="text-lg mb-1">No notifications yet</p>
      <p className="text-sm">Likes, comments, and follows will show up here</p>
    </div>
  ) : (
    <div className="divide-y divide-tab-border">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => { if (n.location_id) { navigate(`/location/${n.location_id}`); markOneRead(n.id); } }}
          className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-surface transition-colors ${!n.read ? 'bg-accent/5' : ''}`}
        >
          {n.actor?.avatar_url && (
            <img src={n.actor.avatar_url} alt="" className="w-9 h-9 rounded-full bg-surface shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] leading-[1.4]">
              <strong className="font-semibold text-ink">{n.actor?.username || 'Someone'}</strong>{' '}
              <span className="text-ink-mute">{typeLabels[n.type] || n.type}</span>
            </p>
            <p className="text-[11px] font-mono text-ink-dim mt-1">
              {new Date(n.created_at).toLocaleDateString()}
            </p>
          </div>
          {!n.read && <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 lg:max-w-[680px] lg:mx-auto lg:px-0">
        <button onClick={() => navigate(-1)} className="text-sm text-ink-mute lg:hidden">← Back</button>
        <h1 className="text-lg font-semibold lg:font-display lg:text-[26px] lg:tracking-tight">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-ink-mute hover:text-ink font-mono">
          Mark all read
        </button>
      </div>

      <div className={isDesktop ? 'max-w-[680px] mx-auto px-0' : 'px-4'}>
        {listContent}
      </div>
    </div>
  );
}

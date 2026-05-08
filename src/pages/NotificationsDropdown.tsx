import { useNavigate } from 'react-router-dom';
import type { Notification } from '../hooks/useNotifications';

const typeLabels: Record<string, string> = {
  like: 'liked your spot',
  comment: 'commented on your spot',
  follow: 'started following you',
  location_status: 'updated spot status',
};

interface NotificationsDropdownProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onClose: () => void;
}

export default function NotificationsDropdown({
  notifications,
  onMarkAllRead,
  onMarkOneRead,
  onClose,
}: NotificationsDropdownProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Click-outside backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div className="absolute top-full left-0 mt-2 w-[380px] max-h-[560px] rounded-card bg-surface border border-chip-border shadow-panel overflow-hidden z-40 origin-top-left animate-[pop-in_200ms_cubic-bezier(.32,.72,0,1)_both]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-tab-border">
          <span className="text-[13px] font-semibold text-ink">Notifications</span>
          <button
            onClick={onMarkAllRead}
            className="text-[12px] text-accent hover:text-accent-hi font-mono"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="max-h-[480px] overflow-y-auto divide-y divide-tab-border overscroll-contain">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-ink-mute">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.location_id) {
                    navigate(`/location/${n.location_id}`);
                    onMarkOneRead(n.id);
                    onClose();
                  }
                }}
                className={`flex items-start gap-3 px-3 py-3.5 cursor-pointer hover:bg-surface-2 transition-colors ${
                  !n.read ? 'bg-accent/5' : ''
                }`}
              >
                {n.actor?.avatar_url && (
                  <img
                    src={n.actor.avatar_url}
                    alt=""
                    className="w-9 h-9 rounded-full bg-surface shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-[1.4]">
                    <strong className="font-semibold text-ink">
                      {n.actor?.username || 'Someone'}
                    </strong>{' '}
                    <span className="text-ink-mute">{typeLabels[n.type] || n.type}</span>
                  </p>
                  <p className="text-[11px] font-mono text-ink-dim mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

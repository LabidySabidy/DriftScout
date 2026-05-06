import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useLeaderboard } from '../hooks/useLeaderboard';
import NotificationsDropdown from '../pages/NotificationsDropdown';

interface DesktopSidebarProps {
  currentPath: string;
  unreadCount: number;
  showNotifs: boolean;
  onToggleNotifs: () => void;
  onCloseNotifs: () => void;
}

export default function DesktopSidebar({
  currentPath,
  unreadCount,
  showNotifs,
  onToggleNotifs,
  onCloseNotifs,
}: DesktopSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, markAllRead } = useNotifications();
  const { entries: leaderboard } = useLeaderboard();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      path: '/locations',
      label: 'Locations',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      path: '/liked',
      label: 'Liked',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Scout';

  return (
    <aside className="w-[220px] shrink-0 h-dvh sticky top-0 bg-bg border-r border-tab-border flex flex-col p-4 gap-1 z-30">
      {/* Logo */}
      <div
        className="px-2 py-3 mb-2 font-display font-bold text-[20px] tracking-tight cursor-pointer"
        style={{ fontFamily: "'Pacifico', cursive" }}
        onClick={() => navigate('/')}
      >
        DriftScout
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-card text-[14px] transition-colors active:scale-[.97] ${
              active
                ? 'text-ink bg-surface relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-accent before:rounded-r'
                : 'text-ink-mute hover:bg-surface hover:text-ink'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Submit a Spot — prominent CTA */}
      <button
        onClick={() => navigate('/submit')}
        className="flex items-center gap-3 px-3 py-2.5 rounded-card text-[14px] text-ink bg-accent hover:bg-accent-hi transition-colors active:scale-[.97] font-semibold mt-2"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Submit a Spot</span>
      </button>

      {/* Notification bell */}
      <div className="relative mt-1">
        <button
          onClick={onToggleNotifs}
          className="flex items-center gap-3 px-3 py-2.5 rounded-card text-[14px] text-ink-mute hover:bg-surface hover:text-ink transition-colors w-full"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span>Notifications</span>
        </button>
        {unreadCount > 0 && (
          <span className="absolute top-1 left-7 w-4 h-4 rounded-full bg-accent text-[9px] text-white grid place-items-center font-mono font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Notification dropdown */}
        {showNotifs && (
          <NotificationsDropdown
            notifications={notifications}
            onMarkAllRead={markAllRead}
            onClose={onCloseNotifs}
          />
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-1">
          <p className="text-[10px] uppercase tracking-[.08em] text-ink-dim font-mono px-2 mb-1.5">Top Scouts</p>
          <div className="space-y-0.5">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={entry.submitter.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface transition-colors">
                <span className="text-[10px] font-mono text-ink-dim w-4 shrink-0">
                  {i === 0 ? '👑' : i + 1}
                </span>
                {entry.submitter.avatar_url && (
                  <img src={entry.submitter.avatar_url} alt="" className="w-5 h-5 rounded-full shrink-0" />
                )}
                <span className="text-[11px] text-ink-mute truncate flex-1">{entry.submitter.username}</span>
                <span className="text-[10px] font-mono text-ink-dim">{entry.spot_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User row */}
      <button
        onClick={() => navigate('/profile')}
        className="mt-auto flex items-center gap-3 p-2 rounded-card hover:bg-surface cursor-pointer transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover bg-surface shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface shrink-0" />
        )}
        <span className="text-[13px] font-medium text-ink truncate">{displayName}</span>
      </button>
    </aside>
  );
}

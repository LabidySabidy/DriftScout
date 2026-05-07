import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import DesktopSidebar from './DesktopSidebar';
import { useState } from 'react';

/** Routes where the mobile tab bar should be hidden (full-screen pages) */
const FULL_SCREEN_PATHS = ['/location/', '/submit', '/notifications'];

export default function AppShell() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url;

  const hideTabBar = FULL_SCREEN_PATHS.some((p) => pathname.startsWith(p));

  const tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/locations', label: 'Locations', icon: 'map' },
    { path: '/liked', label: 'Liked', icon: 'heart' },
    { path: '/profile', label: 'Profile', icon: 'profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  if (!isDesktop) {
    // ── Mobile layout ──
    return (
      <div className="min-h-dvh bg-bg text-ink font-sans flex flex-col">
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <Outlet />
        </div>

        {/* Bottom Tab Bar — hidden on full-screen pages */}
        {!hideTabBar && (
          <nav className="fixed bottom-0 inset-x-0 h-[72px] bg-tab-bg/85 backdrop-blur-xl border-t border-tab-border flex items-center justify-around pb-safe z-30">
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center gap-1 text-[10px] active:scale-[.97] transition-transform duration-100 ${
                    active ? 'text-ink' : 'text-ink-dim'
                  }`}
                >
                  {tab.icon === 'home' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  )}
                  {tab.icon === 'map' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  )}
                  {tab.icon === 'heart' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#EF4444' : 'none'} stroke={active ? '#EF4444' : '#555555'} strokeWidth="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  )}
                  {tab.icon === 'profile' && (
                    avatarUrl ? (
                      <img src={avatarUrl} alt="" className={`w-6 h-6 rounded-full object-cover ${active ? 'ring-2 ring-ink' : 'opacity-50'}`} />
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 ${active ? 'border-ink' : 'border-ink-dim'}`} />
                    )
                  )}
                  {tab.label && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div className="min-h-dvh bg-bg text-ink font-sans flex">
      <DesktopSidebar
        currentPath={pathname}
        unreadCount={unreadCount}
        showNotifs={showNotifs}
        onToggleNotifs={() => setShowNotifs((v) => !v)}
        onCloseNotifs={() => setShowNotifs(false)}
      />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export default function TabLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/locations', label: 'Locations', icon: 'map' },
    { path: '/liked', label: 'Liked', icon: 'heart' },
    { path: '/profile', label: '', icon: 'profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-app-bg text-white flex flex-col">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-tab-bar-bg border-t border-tab-bar-border pb-safe z-50">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
              >
                {tab.icon === 'home' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#555555'} strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                )}
                {tab.icon === 'map' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#555555'} strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                )}
                {tab.icon === 'heart' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#EF4444' : 'none'} stroke={active ? '#EF4444' : '#555555'} strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                )}
                {tab.icon === 'profile' && (
                  <div className={`w-6 h-6 rounded-full border-2 ${active ? 'border-white' : 'border-[#555555]'}`} />
                )}
                {tab.label && (
                  <span className={`text-[10px] font-medium ${active ? 'text-tab-active' : 'text-tab-inactive'}`}>
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

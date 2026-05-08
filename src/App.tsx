/* eslint-disable react-hooks/set-state-in-effect */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import AppShell from './components/AppShell';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import JoinPage from './pages/JoinPage';
import AuthCallback from './pages/AuthCallback';
import InviteRequiredPage from './pages/InviteRequiredPage';
import HomePage from './pages/HomePage';
import LocationsPage from './pages/LocationsPage';
import LikedPage from './pages/LikedPage';
import ProfilePage from './pages/ProfilePage';
import LocationDetailRoute from './pages/LocationDetailRoute';
import SubmitLocationPage from './pages/SubmitLocationPage';
import NotificationsPage from './pages/NotificationsPage';
import OnboardingPage from './pages/OnboardingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsInvite, setNeedsInvite] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from('profiles').select('username, role').eq('id', user.id).single().then(({ data, error }) => {
      if (error || !data || data.role === 'pending') {
        setNeedsInvite(true);
      } else {
        setNeedsOnboarding(data.username === 'Scout');
      }
      setChecking(false);
    });
  }, [user]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink">
        <p className="text-ink-mute">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (needsInvite) return <Navigate to="/invite-required" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/invite-required" element={<InviteRequiredPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* All authenticated routes under AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="liked" element={<LikedPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="location/:id" element={<LocationDetailRoute />} />
          <Route path="submit" element={<SubmitLocationPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

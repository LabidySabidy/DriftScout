/* eslint-disable react-hooks/set-state-in-effect */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import TabLayout from './components/TabLayout';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import HomePage from './pages/HomePage';
import LocationsPage from './pages/LocationsPage';
import LikedPage from './pages/LikedPage';
import ProfilePage from './pages/ProfilePage';
import LocationDetailPage from './pages/LocationDetailPage';
import SubmitLocationPage from './pages/SubmitLocationPage';
import NotificationsPage from './pages/NotificationsPage';
import OnboardingPage from './pages/OnboardingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
      setNeedsOnboarding(data?.username === 'Scout');
      setChecking(false);
    });
  }, [user]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg text-white">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Tabbed layout */}
        <Route element={<ProtectedRoute><TabLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/liked" element={<LikedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Full-screen pages (no tab bar) */}
        <Route path="/location/:id" element={<ProtectedRoute><LocationDetailPage /></ProtectedRoute>} />
        <Route path="/submit" element={<ProtectedRoute><SubmitLocationPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

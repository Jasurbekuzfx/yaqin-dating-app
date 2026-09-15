import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { DiscoverPage } from './pages/DiscoverPage.js';
import { LikesPage } from './pages/LikesPage.js';
import { MatchesPage } from './pages/MatchesPage.js';
import { ChatPage } from './pages/ChatPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { PremiumPage } from './pages/PremiumPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  const { isLoading, isOnboarded } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen bg-yaqin-bg flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-3 border-yaqin-accent border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xl font-black gold-text">Yaqin</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={isOnboarded ? <Navigate to="/discover" replace /> : <OnboardingPage />}
      />
      <Route
        path="/discover"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <DiscoverPage />}
      />
      <Route
        path="/likes"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <LikesPage />}
      />
      <Route
        path="/matches"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <MatchesPage />}
      />
      <Route
        path="/messages/:matchId"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <ChatPage />}
      />
      <Route
        path="/profile"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <ProfilePage />}
      />
      <Route
        path="/premium"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <PremiumPage />}
      />
      <Route
        path="/settings"
        element={!isOnboarded ? <Navigate to="/onboarding" replace /> : <SettingsPage />}
      />
      <Route
        path="*"
        element={<Navigate to={isOnboarded ? '/discover' : '/onboarding'} replace />}
      />
    </Routes>
  );
};

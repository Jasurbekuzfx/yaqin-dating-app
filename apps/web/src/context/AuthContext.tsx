import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram.js';

import { apiFetch } from '../utils/api.js';

interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  isVerified: boolean;
  isPremium: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  login: (token: string, user: User, onboarded: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initData, user: tgUser } = useTelegram();
  const [token, setToken] = useState<string | null>(localStorage.getItem('yaqin_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('yaqin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('yaqin_onboarded') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = (newToken: string, newUser: User, onboarded: boolean) => {
    setToken(newToken);
    setUser(newUser);
    setIsOnboarded(onboarded);
    localStorage.setItem('yaqin_token', newToken);
    localStorage.setItem('yaqin_user', JSON.stringify(newUser));
    localStorage.setItem('yaqin_onboarded', String(onboarded));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsOnboarded(false);
    localStorage.removeItem('yaqin_token');
    localStorage.removeItem('yaqin_user');
    localStorage.removeItem('yaqin_onboarded');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const u: User = {
            id: data.profile.id,
            telegramId: data.profile.telegramId,
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            username: data.profile.username,
            isVerified: data.profile.isVerified,
            isPremium: data.profile.isPremium,
          };
          setUser(u);
          const onboarded = (data.profile.photos && data.profile.photos.length > 0) && !!data.profile.cityId;
          setIsOnboarded(onboarded);
          localStorage.setItem('yaqin_user', JSON.stringify(u));
          localStorage.setItem('yaqin_onboarded', String(onboarded));
        }
      }
    } catch (e) {
      console.error('refreshUser xatolik:', e);
    }
  };

  useEffect(() => {
    const authenticate = async () => {
      if (token) {
        await refreshUser();
        setIsLoading(false);
        return;
      }

      try {
        let payload = initData;
        if (!payload) {
          if (tgUser?.id) {
            payload = `user=${encodeURIComponent(JSON.stringify(tgUser))}`;
          } else if (import.meta.env.DEV) {
            payload = 'mock_100000001';
          }
        }

        if (!payload) {
          setIsLoading(false);
          return;
        }

        const res = await apiFetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: payload }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            login(data.token, data.user, data.isOnboarded);
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, [initData, tgUser]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isOnboarded,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

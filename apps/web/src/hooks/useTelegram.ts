import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    const webapp = window.Telegram?.WebApp;
    if (webapp) {
      webapp.ready();
      webapp.expand();
      try {
        webapp.setHeaderColor('#080A0F');
        webapp.setBackgroundColor('#080A0F');
      } catch (e) {}

      setTg(webapp);
      setInitData(webapp.initData || '');
      if (webapp.initDataUnsafe?.user) {
        setUser(webapp.initDataUnsafe.user);
      }
    }
  }, []);

  const haptic = {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
      try {
        tg?.HapticFeedback?.impactOccurred(style);
      } catch (e) {}
    },
    notification: (type: 'error' | 'success' | 'warning' = 'success') => {
      try {
        tg?.HapticFeedback?.notificationOccurred(type);
      } catch (e) {}
    },
    selection: () => {
      try {
        tg?.HapticFeedback?.selectionChanged();
      } catch (e) {}
    },
  };

  const close = () => {
    tg?.close();
  };

  return {
    tg,
    user,
    initData,
    haptic,
    close,
  };
};

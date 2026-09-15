import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Heart, MessageCircle, User as UserIcon, Sparkles } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram.js';

export const Navigation: React.FC = () => {
  const { haptic } = useTelegram();

  const navItems = [
    { to: '/discover', label: 'Tanishuv', icon: Flame },
    { to: '/likes', label: 'Likelar', icon: Heart },
    { to: '/matches', label: 'Suhbatlar', icon: MessageCircle },
    { to: '/premium', label: 'Premium', icon: Sparkles, highlight: true },
    { to: '/profile', label: 'Profil', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-yaqin-surface/90 backdrop-blur-md border-t border-yaqin-border px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptic.selection()}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all duration-200 py-1 px-2.5 rounded-xl ${
                  isActive
                    ? item.highlight
                      ? 'text-yaqin-accent font-semibold scale-105'
                      : 'text-rose-500 font-semibold scale-105'
                    : 'text-yaqin-muted hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      size={24}
                      className={
                        isActive && item.highlight
                          ? 'drop-shadow-[0_0_8px_rgba(229,169,60,0.5)]'
                          : isActive
                          ? 'drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]'
                          : ''
                      }
                    />
                    {item.highlight && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yaqin-accent animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

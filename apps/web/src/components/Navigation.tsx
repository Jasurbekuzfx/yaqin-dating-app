import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Heart, MessageCircle, User as UserIcon, Clapperboard } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram.js';

export const Navigation: React.FC = () => {
  const { haptic } = useTelegram();

  const navItems = [
    { to: '/discover', label: 'Tanishuv', icon: Flame },
    { to: '/reels', label: 'Videolar', icon: Clapperboard },
    { to: '/likes', label: 'Likes', icon: Heart },
    { to: '/matches', label: 'Chat', icon: MessageCircle },
    { to: '/profile', label: 'Profil', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D12]/90 backdrop-blur-2xl px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptic.selection()}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-all duration-200 py-1 px-3 rounded-2xl ${
                  isActive
                    ? 'text-[#FF4F79] font-bold scale-105'
                    : 'text-[#9AA4B8] hover:text-white font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    className={`transition-all duration-200 stroke-[2.2] ${
                      isActive ? 'stroke-[#FF4F79] fill-[#FF4F79]/15 drop-shadow-[0_2px_8px_rgba(255,79,121,0.4)]' : 'stroke-[#9AA4B8]'
                    }`}
                  />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};


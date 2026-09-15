import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Ban, ShieldCheck, Globe, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { haptic } = useTelegram();

  const [notifLikes, setNotifLikes] = useState(true);
  const [notifMatches, setNotifMatches] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState('uz');

  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await fetch('/api/users/blocked', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBlockedUsers(data.blockedUsers || []);
        }
      } catch (e) {
        console.error('Blocked users error:', e);
      }
    };
    fetchBlocked();
  }, [token]);

  const handleUnblock = async (id: string) => {
    haptic.impact('medium');
    await fetch(`/api/users/${id}/block`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setBlockedUsers(blockedUsers.filter((u) => u.id !== id));
  };

  const handleLogout = () => {
    if (confirm('Haqiqatan ham chiqmoqchimisiz?')) {
      logout();
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-yaqin-bg text-white max-w-md mx-auto p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              haptic.selection();
              navigate('/profile');
            }}
            className="p-1.5 -ml-1 text-yaqin-muted hover:text-white rounded-full"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-black">Sozlamalar va Xavfsizlik</h1>
        </div>

        {/* Bildirishnomalar */}
        <div className="p-4 rounded-3xl bg-yaqin-surface border border-yaqin-border mb-4 space-y-3">
          <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={14} className="text-yaqin-accent" />
            <span>Telegram Bildirishnomalari</span>
          </h3>

          <label className="flex items-center justify-between text-xs font-medium text-slate-200 cursor-pointer">
            <span>Yangi Likelar haqida</span>
            <input
              type="checkbox"
              checked={notifLikes}
              onChange={(e) => setNotifLikes(e.target.checked)}
              className="w-4 h-4 accent-yaqin-accent"
            />
          </label>

          <label className="flex items-center justify-between text-xs font-medium text-slate-200 cursor-pointer">
            <span>Yangi Matchlar haqida</span>
            <input
              type="checkbox"
              checked={notifMatches}
              onChange={(e) => setNotifMatches(e.target.checked)}
              className="w-4 h-4 accent-yaqin-accent"
            />
          </label>

          <label className="flex items-center justify-between text-xs font-medium text-slate-200 cursor-pointer">
            <span>Yangi Xabarlar haqida</span>
            <input
              type="checkbox"
              checked={notifMessages}
              onChange={(e) => setNotifMessages(e.target.checked)}
              className="w-4 h-4 accent-yaqin-accent"
            />
          </label>
        </div>

        {/* Bloklanganlar ro'yxati */}
        <div className="p-4 rounded-3xl bg-yaqin-surface border border-yaqin-border mb-4">
          <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Ban size={14} className="text-rose-500" />
            <span>Bloklangan foydalanuvchilar ({blockedUsers.length})</span>
          </h3>

          {blockedUsers.length === 0 ? (
            <p className="text-xs text-yaqin-muted">Bloklangan foydalanuvchilar mavjud emas</p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-xs font-semibold">{u.firstName}</span>
                  <button
                    onClick={() => handleUnblock(u.id)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Blokdan chiqarish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Til sozlamalari */}
        <div className="p-4 rounded-3xl bg-yaqin-surface border border-yaqin-border mb-4">
          <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <Globe size={14} className="text-sky-400" />
            <span>Ilova tili</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'uz', name: 'Oʻzbek' },
              { code: 'ru', name: 'Русский' },
              { code: 'en', name: 'English' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`py-2 rounded-xl text-xs font-semibold border ${
                  selectedLang === lang.code
                    ? 'border-yaqin-accent bg-yaqin-accent/15 text-yaqin-accent'
                    : 'border-yaqin-border text-yaqin-muted'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chiqish */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <LogOut size={16} />
          <span>Ilovadan chiqish</span>
        </button>
      </div>

      <div className="text-center text-[10px] text-yaqin-muted pt-6">
        Yaqin v1.0.0 — Barcha huquqlar himoyalangan
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Sparkles, CheckCheck } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { haptic } = useTelegram();

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await fetch('/api/matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const matches = data?.matches || [];

  return (
    <div className="min-h-screen bg-yaqin-bg text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Sarlavha */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tight">Suhbatlar</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yaqin-surface border border-yaqin-border text-yaqin-muted">
            {matches.length} ta match
          </span>
        </div>

        {/* 1. Yangi Matchlar gorizontal karuseli */}
        {matches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider mb-3">
              Yangi Matchlar
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {matches.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/messages/${m.id}`);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-full p-0.5 gold-gradient relative">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-yaqin-bg bg-yaqin-surface">
                      <img
                        src={m.partner.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={m.partner.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[64px]">
                    {m.partner.firstName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Xabarlar ro'yxati */}
        <div>
          <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider mb-3">
            Xabarlar
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-18 rounded-2xl bg-yaqin-surface animate-pulse" />
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2">
              {matches.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/messages/${m.id}`);
                  }}
                  className="p-3 rounded-2xl bg-yaqin-surface/60 hover:bg-yaqin-surface border border-yaqin-border flex items-center gap-3 cursor-pointer transition-all active:scale-98"
                >
                  <div className="w-13 h-13 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={m.partner.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={m.partner.firstName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-bold text-white truncate">
                        {m.partner.firstName}, {m.partner.age}
                      </h4>
                      <span className="text-[10px] text-yaqin-muted">
                        {new Date(m.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-yaqin-muted truncate">
                      {m.lastMessage ? m.lastMessage.content : 'Salom deb suhbatni boshlang! 👋'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Bo'sh holat */
            <div className="text-center p-8 glass-panel rounded-3xl mt-6">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-lg font-bold mb-1">Birinchi Match’ingizni toping</h3>
              <p className="text-yaqin-muted text-xs leading-relaxed mb-6">
                Koʻproq insonlar bilan muloqot qilish uchun profillarga Like bosing. Oʻzaro yoqqaningizda chat ochiladi!
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="px-5 py-2.5 rounded-2xl gold-gradient text-yaqin-bg font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                Tanishuvga oʻtish
              </button>
            </div>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

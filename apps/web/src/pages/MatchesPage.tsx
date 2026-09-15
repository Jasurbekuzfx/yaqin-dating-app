import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Heart, Search } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
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
    <div className="min-h-screen bg-[#0B0D12] text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between font-sans">
      <div>
        {/* 1. Header */}
        <div className="flex items-center justify-between mb-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
              <Heart size={16} className="fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Yaqin</span>
          </div>

          <button
            onClick={() => haptic.selection()}
            className="p-2 rounded-full bg-[#151923] border border-white/10 text-[#9AA4B8] hover:text-white transition-colors"
          >
            <Search size={18} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Suhbatlar</h1>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-[#FF4F79]/20 text-[#FF4F79] border border-[#FF4F79]/30">
              {matches.length}
            </span>
          </div>
          <p className="text-[#9AA4B8] text-xs font-medium">Sizni yoqtirgan va siz yoqtirgan insonlar.</p>
        </div>

        {/* 2. Yangi Matchlar Stories Karuseli */}
        <div className="mb-5">
          <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none">
            {/* Barchasi Icon Circle */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0">
              <div className="w-15 h-15 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                <Heart size={24} className="fill-white" />
              </div>
              <span className="text-[11px] font-bold text-[#FF4F79]">Barchasi</span>
            </div>

            {matches.map((m: any) => (
              <div
                key={m.id}
                onClick={() => {
                  haptic.selection();
                  navigate(`/messages/${m.id}`);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
              >
                <div className="w-15 h-15 rounded-full p-0.5 border-2 border-[#FF4F79] relative shadow-lg">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#151923]">
                    <img
                      src={
                        m.partner.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={m.partner.firstName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0D12]" />
                </div>
                <span className="text-[11px] font-bold text-white truncate max-w-[62px]">
                  {m.partner.firstName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Xabarlar ro'yxati */}
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-16 rounded-[24px] bg-[#151923] animate-pulse border border-white/10"
                />
              ))}
            </div>
          ) : matches.length > 0 ? (
            <div className="space-y-2.5">
              {matches.map((m: any, idx: number) => (
                <div
                  key={m.id}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/messages/${m.id}`);
                  }}
                  className="p-3.5 rounded-[24px] bg-[#151923] border border-white/10 hover:border-[#FF4F79]/40 shadow-lg flex items-center gap-3.5 cursor-pointer transition-all active:scale-98"
                >
                  <div className="w-13 h-13 rounded-full overflow-hidden flex-shrink-0 border border-white/15 relative bg-[#0B0D12]">
                    <img
                      src={
                        m.partner.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={m.partner.firstName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-black text-white truncate">
                        {m.partner.firstName}, {m.partner.age}
                      </h4>
                      <span className="text-[10px] text-[#9AA4B8] font-semibold">
                        {new Date(m.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-300 truncate max-w-[200px]">
                        {m.lastMessage ? m.lastMessage.content : 'Salom! Qanday ketyapti? 😊'}
                      </p>
                      {idx === 0 && (
                        <span className="w-4.5 h-4.5 rounded-full bg-[#FF4F79] text-white text-[10px] font-bold flex items-center justify-center shadow">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Bo'sh holat */
            <div className="text-center p-8 bg-[#151923] rounded-[28px] border border-white/10 shadow-xl mt-6">
              <div className="w-14 h-14 rounded-full bg-[#FF4F79]/20 text-[#FF4F79] flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-base font-extrabold text-white mb-1">
                Birinchi Match’ingizni toping
              </h3>
              <p className="text-[#9AA4B8] text-xs leading-relaxed mb-5">
                Koʻproq insonlar bilan muloqot qilish uchun Tanishuv boʻlimida Like bosing.
              </p>
              <button
                onClick={() => navigate('/discover')}
                className="px-6 py-3 rounded-2xl bg-[#FF4F79] text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
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


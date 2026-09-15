import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const LikesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['receivedLikes'],
    queryFn: async () => {
      const res = await fetch('/api/likes/received', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const isPremium = data?.isPremium || false;
  const totalCount = data?.totalCount || 0;
  const likes = data?.likes || [];

  // Premium user uchun o'sha yerdan Like bosish
  const likeMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await fetch(`/api/discover/${targetUserId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'LIKE' }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedLikes'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      haptic.notification('success');
    },
  });

  return (
    <div className="min-h-screen bg-yaqin-bg text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Sarlavha */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sizni yoqtirganlar</h1>
            <p className="text-yaqin-muted text-xs">
              {totalCount > 0
                ? `Sizning profilingiz ${totalCount} kishiga maʼqul keldi`
                : 'Hozircha yangi yoqtirishlar yoʻq'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <Heart size={20} className="fill-rose-500" />
          </div>
        </div>

        {/* Bepul foydalanuvchilar uchun Premium Banner */}
        {!isPremium && totalCount > 0 && (
          <div
            onClick={() => {
              haptic.impact('light');
              navigate('/premium');
            }}
            className="mb-6 p-4 rounded-3xl border border-yaqin-accent/40 bg-gradient-to-br from-yaqin-accent/20 via-yaqin-surface to-yaqin-surface cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl gold-gradient text-yaqin-bg">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Yaqin Premium</h4>
                <p className="text-[11px] text-slate-300">Kim sizni yoqtirganini hoziroq koʻring</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-yaqin-accent" />
          </div>
        )}

        {/* Likelar to'plami */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] rounded-2xl bg-yaqin-surface animate-pulse" />
            ))}
          </div>
        ) : likes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {likes.map((item: any) => (
              <div
                key={item.id}
                className="aspect-[3/4] rounded-3xl overflow-hidden relative border border-yaqin-border bg-yaqin-surface group"
              >
                <img
                  src={isPremium ? item.user.photoUrl : item.user.blurredPhotoUrl}
                  alt="Yoqtirgan inson"
                  className={`w-full h-full object-cover ${
                    !isPremium ? 'blur-md scale-110' : ''
                  }`}
                />

                {/* Qoplama */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Agar bepul bo'lsa qulflangan belgi */}
                {!isPremium ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10">
                    <div className="p-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-yaqin-accent mb-2">
                      <Lock size={20} />
                    </div>
                    <span className="text-[11px] font-semibold text-white/90">
                      Koʻrish uchun Premium
                    </span>
                  </div>
                ) : (
                  /* Premium uchun profil tafsilotlari va harakat */
                  <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {item.user.firstName}
                      </h4>
                      <span className="text-[10px] text-slate-300">{item.user.city}</span>
                    </div>

                    <button
                      onClick={() => likeMutation.mutate(item.user.id)}
                      className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                    >
                      <Heart size={18} className="fill-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center p-8 glass-panel rounded-3xl mt-10">
            <Heart size={36} className="text-yaqin-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">Hozircha yangi yoqtirishlar yoʻq</h3>
            <p className="text-yaqin-muted text-xs leading-relaxed mb-4">
              Profilingizni yangilab turing yoki koʻproq insonlar sizni koʻrishi uchun Boost dan foydalaning.
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="px-4 py-2 rounded-xl gold-gradient text-yaqin-bg font-bold text-xs"
            >
              Profilni koʻtarish (Boost)
            </button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

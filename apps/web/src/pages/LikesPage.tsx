import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Lock, Crown, Sparkles } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const LikesPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'NEW' | 'PREMIUM'>('ALL');

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

  // Like bosish mutatsiyasi
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
    <div className="min-h-screen bg-[#0B0D12] text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between font-sans">
      <div>
        {/* 1. Sarlavha & Header */}
        <div className="flex items-center justify-between mb-3 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
              <Heart size={16} className="fill-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Yaqin</span>
          </div>

          <button
            onClick={() => {
              haptic.selection();
              navigate('/premium');
            }}
            className="p-2 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40 transition-transform active:scale-90"
          >
            <Crown size={18} className="fill-[#D9A441]" />
          </button>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-white mb-0.5">
            Kim sizni yoqtirdi?
          </h1>
          <p className="text-[#9AA4B8] text-xs font-medium">
            Sizga qiziqqan insonlar shu yerda.
          </p>
        </div>

        {/* 2. Filter Tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-[#FF4F79] text-white shadow-lg shadow-rose-500/30'
                : 'bg-[#151923] text-[#9AA4B8] border border-white/10'
            }`}
          >
            Barchasi {totalCount > 0 ? `(${totalCount})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'NEW'
                ? 'bg-[#FF4F79] text-white shadow-lg shadow-rose-500/30'
                : 'bg-[#151923] text-[#9AA4B8] border border-white/10'
            }`}
          >
            Yangi
          </button>
          <button
            onClick={() => {
              setActiveTab('PREMIUM');
              if (!isPremium) navigate('/premium');
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === 'PREMIUM'
                ? 'bg-[#D9A441] text-[#0B0D12] shadow-lg shadow-amber-500/30'
                : 'bg-[#151923] text-[#9AA4B8] border border-white/10'
            }`}
          >
            ⭐ Premium
          </button>
        </div>

        {/* 3. 2-Column Grid of Likes */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[3/4] rounded-[24px] bg-[#151923] animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : likes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {likes.map((item: any) => (
              <div
                key={item.id}
                className="aspect-[3/4] rounded-[24px] overflow-hidden relative border border-white/10 bg-[#151923] shadow-lg group"
              >
                <img
                  src={isPremium ? item.user.photoUrl : item.user.blurredPhotoUrl}
                  alt="Yoqtirgan inson"
                  className={`w-full h-full object-cover ${
                    !isPremium ? 'blur-md scale-110' : ''
                  }`}
                />

                {/* Top Right floating Heart */}
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-[#FF4F79] z-10 border border-white/15">
                  <Heart size={14} className="fill-[#FF4F79]" />
                </div>

                {/* Qoplama */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-black/20 to-transparent" />

                {/* Agar bepul bo'lsa qulflangan belgi */}
                {!isPremium ? (
                  <div
                    onClick={() => navigate('/premium')}
                    className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-[#D9A441] mb-2 border border-[#D9A441]/40 flex items-center justify-center shadow-lg">
                      <Lock size={18} />
                    </div>
                    <span className="text-[11px] font-bold text-white drop-shadow">
                      Premium bilan koʻring
                    </span>
                  </div>
                ) : (
                  /* Premium uchun nom va shahar */
                  <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-white">
                    <div>
                      <h4 className="text-sm font-extrabold leading-tight text-white drop-shadow">
                        {item.user.firstName}
                      </h4>
                      <span className="text-[10px] text-stone-300">📍 {item.user.city}</span>
                    </div>

                    <button
                      onClick={() => likeMutation.mutate(item.fromUserId || item.user.id)}
                      className="w-8 h-8 rounded-full bg-[#FF4F79] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                    >
                      <Heart size={14} className="fill-white" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center p-8 bg-[#151923] rounded-[28px] border border-white/10 shadow-xl mt-6">
            <Heart size={40} className="text-[#FF4F79] mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-white mb-1">
              Hozircha sizni yoqtirganlar yoʻq
            </h3>
            <p className="text-[#9AA4B8] text-xs leading-relaxed mb-5">
              Koʻproq insonlar sizni koʻrishi uchun profilingizni faollashtiring yoki yangi fotosuratlar qoʻshing.
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="px-6 py-3 rounded-2xl bg-[#FF4F79] text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
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


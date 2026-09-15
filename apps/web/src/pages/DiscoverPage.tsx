import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from '../components/Navigation.js';
import { ProfileCard } from '../components/ProfileCard.js';
import { MatchModal } from '../components/MatchModal.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';
import { DiscoverCandidateDto } from '@yaqin/shared';
import { Sparkles, RefreshCw, AlertCircle, X, ShieldAlert, Ban } from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const { token, user } = useAuth();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMatch, setActiveMatch] = useState<{
    id: string;
    partnerName: string;
    partnerPhotoUrl?: string;
  } | null>(null);

  // Batafsil profil oynasi
  const [detailsCandidate, setDetailsCandidate] = useState<DiscoverCandidateDto | null>(null);

  // 1. Tavsiyalarni yuklash
  const { data, isLoading, isError, refetch } = useQuery<{
    success: boolean;
    candidates: DiscoverCandidateDto[];
  }>({
    queryKey: ['discover'],
    queryFn: async () => {
      const res = await fetch('/api/discover?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const candidates = data?.candidates || [];
  const currentCandidate = candidates[currentIndex];

  // 2. Like yuborish mutatsiyasi
  const likeMutation = useMutation({
    mutationFn: async ({ targetUserId, type }: { targetUserId: string; type: 'LIKE' | 'SUPER_LIKE' }) => {
      const res = await fetch(`/api/discover/${targetUserId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      return res.json();
    },
    onSuccess: (resData, variables) => {
      if (resData.isMatch && resData.match) {
        const candidate = candidates.find((c) => c.id === variables.targetUserId);
        setActiveMatch({
          id: resData.match.id,
          partnerName: candidate?.firstName || 'Sizning yangi juftingiz',
          partnerPhotoUrl: candidate?.photos[0]?.url,
        });
      }
    },
  });

  // 3. Skip mutatsiyasi
  const skipMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await fetch(`/api/discover/${targetUserId}/skip`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const handleLike = () => {
    if (!currentCandidate) return;
    likeMutation.mutate({ targetUserId: currentCandidate.id, type: 'LIKE' });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (!currentCandidate) return;
    skipMutation.mutate(currentCandidate.id);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSuperLike = () => {
    if (!currentCandidate) return;
    likeMutation.mutate({ targetUserId: currentCandidate.id, type: 'SUPER_LIKE' });
    setCurrentIndex((prev) => prev + 1);
  };

  // Bloklash
  const handleBlock = async (targetId: string) => {
    if (confirm('Bu foydalanuvchini bloklamoqchimisiz?')) {
      await fetch(`/api/users/${targetId}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailsCandidate(null);
      setCurrentIndex((prev) => prev + 1);
      haptic.notification('success');
    }
  };

  // Shikoyat qilish
  const handleReport = async (targetId: string) => {
    const reason = prompt('Shikoyat sababini kiriting:\n(Masalan: Soxta profil, Spam, Haqorat)');
    if (reason) {
      await fetch(`/api/users/${targetId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'OTHER', description: reason }),
      });
      setDetailsCandidate(null);
      setCurrentIndex((prev) => prev + 1);
      alert('Shikoyatingiz qabul qilindi');
    }
  };

  return (
    <div className="min-h-screen bg-yaqin-bg text-white pb-24 flex flex-col justify-between max-w-md mx-auto relative overflow-hidden">
      {/* Yuqori panel */}
      <header className="px-5 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight gold-text">Yaqin</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yaqin-accent/15 text-yaqin-accent border border-yaqin-accent/20">
            MINI APP
          </span>
        </div>

        <button
          onClick={() => {
            haptic.impact('light');
            refetch();
          }}
          className="p-2 rounded-full bg-yaqin-surface border border-yaqin-border text-yaqin-muted hover:text-white"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Asosiy swipe maydoni */}
      <main className="flex-1 px-4 relative flex items-center justify-center my-2">
        {isLoading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-yaqin-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-yaqin-muted text-sm font-medium">Eng mos nomzodlar qidirilmoqda...</p>
          </div>
        ) : isError ? (
          <div className="text-center p-6 glass-panel rounded-3xl">
            <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-semibold mb-3">Tavsiyalarni yuklashda xatolik yuz berdi</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl gold-gradient text-yaqin-bg font-bold text-xs"
            >
              Qayta urinish
            </button>
          </div>
        ) : currentCandidate ? (
          <div className="relative w-full h-[620px] max-h-[78vh]">
            <ProfileCard
              key={currentCandidate.id}
              candidate={currentCandidate}
              onLike={handleLike}
              onSkip={handleSkip}
              onSuperLike={handleSuperLike}
              onOpenDetails={() => setDetailsCandidate(currentCandidate)}
            />
          </div>
        ) : (
          /* Empty State */
          <div className="text-center p-8 glass-panel rounded-3xl max-w-xs mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">
              ✨
            </div>
            <h3 className="text-xl font-bold mb-2">Buguncha profillar qolmadi</h3>
            <p className="text-yaqin-muted text-xs leading-relaxed mb-6">
              Siz barcha mavjud profillarni koʻrib boʻldingiz. Yangi foydalanuvchilar qoʻshilishi bilan bu yerda paydo boʻladi.
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                refetch();
              }}
              className="px-5 py-2.5 rounded-2xl gold-gradient text-yaqin-bg font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              Boshidan koʻrish
            </button>
          </div>
        )}
      </main>

      {/* Match tabrik modali */}
      {activeMatch && (
        <MatchModal
          matchId={activeMatch.id}
          partnerName={activeMatch.partnerName}
          partnerPhotoUrl={activeMatch.partnerPhotoUrl}
          onClose={() => setActiveMatch(null)}
        />
      )}

      {/* To'liq Profil Ma'lumotlari Modali (Details) */}
      {detailsCandidate && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto p-4 flex flex-col justify-between animate-fade-in">
          <div className="max-w-md mx-auto w-full">
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setDetailsCandidate(null)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>
            </div>

            {/* Galereya */}
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 mb-4 relative shadow-2xl">
              <img
                src={detailsCandidate.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                alt={detailsCandidate.firstName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="glass-panel p-5 rounded-3xl mb-4">
              <h2 className="text-2xl font-black text-white mb-1">
                {detailsCandidate.firstName}, {detailsCandidate.age}
              </h2>
              <p className="text-yaqin-muted text-sm mb-4">{detailsCandidate.city}</p>

              {detailsCandidate.bio && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-yaqin-accent uppercase tracking-wider mb-1">Men haqimda</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{detailsCandidate.bio}</p>
                </div>
              )}

              {/* Xavfsizlik harakatlari: Block / Report */}
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => handleBlock(detailsCandidate.id)}
                  className="flex-1 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  <span>Bloklash</span>
                </button>
                <button
                  onClick={() => handleReport(detailsCandidate.id)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <ShieldAlert size={14} />
                  <span>Shikoyat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pastki navigatsiya */}
      <Navigation />
    </div>
  );
};

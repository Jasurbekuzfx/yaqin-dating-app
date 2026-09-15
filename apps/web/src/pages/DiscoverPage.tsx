import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigation } from '../components/Navigation.js';
import { ProfileCard } from '../components/ProfileCard.js';
import { MatchModal } from '../components/MatchModal.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';
import { DiscoverCandidateDto } from '@yaqin/shared';
import { SlidersHorizontal, RefreshCw, AlertCircle, X, ShieldAlert, Ban, Heart, Star, Sparkles, Check, RotateCcw } from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const { token } = useAuth();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMatch, setActiveMatch] = useState<{
    id: string;
    partnerName: string;
    partnerPhotoUrl?: string;
  } | null>(null);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCityId, setFilterCityId] = useState('');
  const [filterGender, setFilterGender] = useState<'ALL' | 'FEMALE' | 'MALE'>('ALL');
  const [filterMinAge, setFilterMinAge] = useState(18);
  const [filterMaxAge, setFilterMaxAge] = useState(50);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

  // Config data for cities
  const [cities, setCities] = useState<{ id: string; name: string; region?: string }[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/profile/config');
        if (res.ok) {
          const cfg = await res.json();
          setCities(cfg.cities || []);
        }
      } catch (e) {
        console.error('Config fetch error:', e);
      }
    };
    fetchConfig();
  }, []);

  // Batafsil profil modali
  const [detailsCandidate, setDetailsCandidate] = useState<DiscoverCandidateDto | null>(null);

  // 1. Tavsiyalarni yuklash
  const { data, isLoading, isError, refetch } = useQuery<{
    success: boolean;
    candidates: DiscoverCandidateDto[];
  }>({
    queryKey: ['discover', filterCityId, filterGender, filterMinAge, filterMaxAge, filterVerifiedOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '25',
        cityId: filterCityId,
        gender: filterGender,
        minAge: String(filterMinAge),
        maxAge: String(filterMaxAge),
        verifiedOnly: String(filterVerifiedOnly),
      });
      const res = await fetch(`/api/discover?${params.toString()}`, {
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
    haptic.impact('heavy');
    likeMutation.mutate({ targetUserId: currentCandidate.id, type: 'LIKE' });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    if (!currentCandidate) return;
    haptic.impact('medium');
    skipMutation.mutate(currentCandidate.id);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSuperLike = () => {
    if (!currentCandidate) return;
    haptic.impact('heavy');
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
    <div className="min-h-screen bg-[#0B0D12] text-white pb-24 flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans">
      {/* 1. Header */}
      <header className="px-5 pt-3 pb-1 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <Heart size={16} className="fill-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">Yaqin</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.selection();
              refetch();
            }}
            className="p-2 rounded-full bg-[#151923] border border-white/10 text-[#9AA4B8] hover:text-white transition-colors"
          >
            <RefreshCw size={17} />
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setIsFilterOpen(true);
            }}
            className={`p-2 rounded-full border transition-colors ${
              filterCityId || filterGender !== 'ALL' || filterMinAge > 18 || filterMaxAge < 50 || filterVerifiedOnly
                ? 'bg-[#FF4F79]/20 border-[#FF4F79] text-[#FF4F79]'
                : 'bg-[#151923] border-white/10 text-[#9AA4B8] hover:text-white'
            }`}
          >
            <SlidersHorizontal size={17} />
          </button>
        </div>
      </header>

      {/* Sub-header Filter Pill Bar */}
      <div className="px-5 pb-1 flex items-center justify-between text-xs font-semibold">
        <span className="text-[#FF4F79] font-bold border-b-2 border-[#FF4F79] pb-0.5">Tanishuv</span>
        <button
          onClick={() => setIsFilterOpen(true)}
          className="text-[#9AA4B8] hover:text-[#FF4F79] text-[11px] font-medium flex items-center gap-1 transition-colors"
        >
          <span>
            📍 {filterCityId ? cities.find((c) => c.id === filterCityId)?.name || 'Tanlangan shahar' : 'Barcha hududlar'}
          </span>
          <span>•</span>
          <span>{filterMinAge}-{filterMaxAge} yosh</span>
        </button>
      </div>

      {/* 2. Asosiy Discover Card Maydoni */}
      <main className="flex-1 px-4 relative flex items-center justify-center my-1">
        {isLoading ? (
          <div className="text-center p-8">
            <div className="w-12 h-12 border-3 border-[#FF4F79] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9AA4B8] text-xs font-semibold">Eng mos nomzodlar qidirilmoqda...</p>
          </div>
        ) : isError ? (
          <div className="text-center p-8 bg-[#151923] rounded-[28px] border border-white/10 shadow-2xl max-w-xs mx-auto">
            <AlertCircle size={36} className="text-rose-500 mx-auto mb-3" />
            <p className="text-xs font-bold mb-3 text-white">Tavsiyalarni yuklashda xatolik</p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-2xl bg-[#FF4F79] text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
            >
              Qayta urinish
            </button>
          </div>
        ) : currentCandidate ? (
          <div className="relative w-full h-[65vh] max-h-[70vh]">
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
          <div className="text-center p-8 bg-[#151923] rounded-[28px] border border-white/10 shadow-2xl max-w-xs mx-auto">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl mx-auto mb-3">
              ✨
            </div>
            <h3 className="text-base font-extrabold text-white mb-1.5">Buguncha yangi profillar qolmadi</h3>
            <p className="text-[#9AA4B8] text-xs leading-relaxed mb-5">
              Siz barcha mavjud profillarni koʻrib boʻldingiz. Birozdan keyin yana tekshiring.
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                refetch();
              }}
              className="px-6 py-3 rounded-2xl bg-[#FF4F79] text-white font-bold text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
            >
              Qayta qidirish
            </button>
          </div>
        )}
      </main>

      {/* 3. Floating 3 Action Buttons */}
      {currentCandidate && (
        <div className="px-8 py-2 flex items-center justify-center gap-6 z-30">
          {/* Skip */}
          <button
            onClick={handleSkip}
            className="w-13 h-13 rounded-full bg-[#151923] border border-white/15 shadow-lg text-[#9AA4B8] hover:text-rose-400 hover:scale-105 active:scale-90 transition-all flex items-center justify-center"
          >
            <X size={24} className="stroke-[2.5]" />
          </button>

          {/* Like (Primary Big Coral) */}
          <button
            onClick={handleLike}
            className="w-17 h-17 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] text-white shadow-[0_8px_25px_rgba(255,79,121,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            <Heart size={32} className="fill-white stroke-none" />
          </button>

          {/* Super Like */}
          <button
            onClick={handleSuperLike}
            className="w-13 h-13 rounded-full bg-[#151923] border border-[#D9A441]/40 shadow-lg text-[#D9A441] hover:scale-105 active:scale-90 transition-all flex items-center justify-center"
          >
            <Star size={24} className="fill-[#D9A441] stroke-none" />
          </button>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-4 flex flex-col justify-between">
          <div className="max-w-md mx-auto w-full bg-[#151923] rounded-[28px] overflow-hidden shadow-2xl p-5 border border-white/10 my-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-[#9AA4B8] uppercase tracking-wider">Profil tafsilotlari</span>
              <button
                onClick={() => setDetailsCandidate(null)}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4 relative shadow-lg">
              <img
                src={detailsCandidate.photos[0]?.url}
                alt={detailsCandidate.firstName}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-2xl font-black text-white mb-0.5">
              {detailsCandidate.firstName}, {detailsCandidate.age}
            </h2>
            <p className="text-[#9AA4B8] text-xs font-medium mb-3">📍 {detailsCandidate.city}</p>

            {detailsCandidate.bio && (
              <p className="text-stone-200 text-xs leading-relaxed bg-[#0B0D12] p-3 rounded-2xl border border-white/5 mb-4">
                {detailsCandidate.bio}
              </p>
            )}

            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => handleBlock(detailsCandidate.id)}
                className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-500/20"
              >
                <Ban size={14} />
                <span>Bloklash</span>
              </button>
              <button
                onClick={() => handleReport(detailsCandidate.id)}
                className="flex-1 py-2 rounded-xl bg-white/5 text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-white/10"
              >
                <ShieldAlert size={14} />
                <span>Shikoyat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Bottom Sheet Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-fade-in">
          <div className="w-full max-w-md bg-[#151923] border-t border-white/15 rounded-t-[32px] p-5 max-h-[85vh] overflow-y-auto shadow-2xl font-sans">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#FF4F79]" />
                <h3 className="text-base font-black text-white">Qidiruv filtrlari</h3>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#9AA4B8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Hudud / Viloyat / Tuman */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Viloyat va Tuman
                </label>
                <select
                  value={filterCityId}
                  onChange={(e) => {
                    setFilterCityId(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0B0D12] border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-[#FF4F79]"
                >
                  <option value="">🇺🇿 Barcha viloyat va tumanlar</option>
                  {Array.from(new Set(cities.map((c) => c.region || 'Boshqa'))).map((reg) => (
                    <optgroup key={reg} label={`📍 ${reg}`}>
                      {cities
                        .filter((c) => (c.region || 'Boshqa') === reg)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* 2. Kimni qidiryapsiz */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Kimni qidiryapsiz?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'ALL', label: '👩‍❤️‍👨 Barchasi' },
                    { val: 'FEMALE', label: '👩 Ayollar' },
                    { val: 'MALE', label: '👨 Erkaklar' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setFilterGender(item.val as any);
                        setCurrentIndex(0);
                      }}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                        filterGender === item.val
                          ? 'border-[#FF4F79] bg-[#FF4F79]/20 text-[#FF4F79]'
                          : 'border-white/10 bg-[#0B0D12] text-[#9AA4B8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Yosh oralig'i */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-300">
                    Yosh oraligʻi:
                  </label>
                  <span className="text-xs font-bold text-[#FF4F79]">
                    {filterMinAge} — {filterMaxAge} yosh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#9AA4B8] mb-1 block">Minimal yosh</span>
                    <input
                      type="number"
                      min={18}
                      max={filterMaxAge}
                      value={filterMinAge}
                      onChange={(e) => {
                        setFilterMinAge(Math.max(18, parseInt(e.target.value) || 18));
                        setCurrentIndex(0);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D12] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-[#FF4F79]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9AA4B8] mb-1 block">Maksimal yosh</span>
                    <input
                      type="number"
                      min={filterMinAge}
                      max={75}
                      value={filterMaxAge}
                      onChange={(e) => {
                        setFilterMaxAge(Math.min(75, parseInt(e.target.value) || 50));
                        setCurrentIndex(0);
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0B0D12] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-[#FF4F79]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Faqat tasdiqlangan profillar toggle */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0D12] border border-white/10 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-full bg-sky-500/20 text-sky-400">
                    <Check size={14} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">Faqat tasdiqlangan profillar</span>
                    <span className="text-[10px] text-[#9AA4B8]">Koʻk nishonga ega foydalanuvchilar</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={filterVerifiedOnly}
                  onChange={(e) => {
                    haptic.selection();
                    setFilterVerifiedOnly(e.target.checked);
                    setCurrentIndex(0);
                  }}
                  className="w-4 h-4 accent-[#FF4F79]"
                />
              </label>

              {/* Buttons: Filtrlash va Tozalash */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic.impact('light');
                    setFilterCityId('');
                    setFilterGender('ALL');
                    setFilterMinAge(18);
                    setFilterMaxAge(50);
                    setFilterVerifiedOnly(false);
                    setCurrentIndex(0);
                  }}
                  className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[#9AA4B8] font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-98 transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Tozalash</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.impact('heavy');
                    setIsFilterOpen(false);
                    setCurrentIndex(0);
                    refetch();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-[#FF4F79] hover:bg-[#E03A5B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-98 transition-all"
                >
                  <Check size={16} />
                  <span>Natijalarni koʻrish</span>
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


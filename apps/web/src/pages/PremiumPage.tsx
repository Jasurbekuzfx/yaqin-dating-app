import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Zap, Crown, ArrowLeft, Heart, CheckCircle2, Flame } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'boost' ? 'boost' : 'premium';

  const { token, refreshUser, user } = useAuth();
  const { haptic } = useTelegram();

  const [activeTab, setActiveTab] = useState<'premium' | 'boost'>(initialTab);
  const [selectedPlan, setSelectedPlan] = useState('plan_1_month');
  const [selectedBoost, setSelectedBoost] = useState('boost_1_hour');
  const [isProcessing, setIsProcessing] = useState(false);

  const premiumFeatures = [
    'Cheksiz Like va Super Likelar',
    'Kim sizni yoqtirganini koʻrish',
    'Profilingizda oltin Premium nishoni',
    'Kengaytirilgan qidiruv filtrlari',
    'Reklamasiz va cheklovlarsiz muloqot',
  ];

  const boostFeatures = [
    'Profilingiz 1-oʻrinda koʻrsatiladi',
    '5x dan 10x gacha koʻproq koʻrishlar',
    'Yaqin atrofdagilarga birinchi boʻlib chiqadi',
    'Profil atrofida olovli Boost nishoni',
  ];

  // Real backend narxlar katalogi
  const { data: catalogData } = useQuery({
    queryKey: ['premiumPlans'],
    queryFn: async () => {
      const res = await fetch('/api/premium/plans');
      if (!res.ok) throw new Error('Katalog yuklanmadi');
      return res.json();
    },
  });

  const backendPlans = catalogData?.premiumPlans || [
    { id: 'plan_7_days', titleUz: '7 kun', priceUzs: 15000, starsAmount: 75, durationDays: 7 },
    { id: 'plan_1_month', titleUz: '1 oy', priceUzs: 39000, starsAmount: 195, isPopular: true, durationDays: 30 },
    { id: 'plan_3_months', titleUz: '3 oy', priceUzs: 89000, starsAmount: 445, discountPercentage: 25, durationDays: 90 },
    { id: 'plan_1_year', titleUz: '1 yil', priceUzs: 299000, starsAmount: 1495, discountPercentage: 40, durationDays: 365 },
  ];

  const backendBoosts = catalogData?.boostPlans || [
    { id: 'boost_1_hour', titleUz: '1 soat', priceUzs: 10000, starsAmount: 50, multiplier: 2.0 },
    { id: 'boost_3_hours', titleUz: '3 soat', priceUzs: 25000, starsAmount: 125, multiplier: 2.5, isPopular: true },
    { id: 'boost_24_hours', titleUz: '24 soat', priceUzs: 50000, starsAmount: 250, multiplier: 3.0 },
  ];

  // 1. Premium sotib olish
  const handleSubscribe = async () => {
    setIsProcessing(true);
    haptic.impact('heavy');

    try {
      const createRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productType: 'PREMIUM',
          productId: selectedPlan,
          paymentMethod: 'STARS',
        }),
      });

      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.error);

      if (createData.payment?.invoiceLink && (window as any).Telegram?.WebApp?.openInvoice) {
        (window as any).Telegram.WebApp.openInvoice(createData.payment.invoiceLink, async (status: string) => {
          if (status === 'paid') {
            haptic.notification('success');
            alert('🎉 Tabriklaymiz! Yaqin Premium faollashtirildi.');
            await refreshUser();
          }
        });
        return;
      }

      // Dev verify fallback
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerPaymentId: createData.payment.providerPaymentId,
          status: 'PAID',
        }),
      });

      if (verifyRes.ok) {
        haptic.notification('success');
        alert('🎉 Tabriklaymiz! Yaqin Premium faollashtirildi.');
        await refreshUser();
      }
    } catch (e: any) {
      alert('Toʻlovda xatolik: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Boost sotib olish
  const handleBuyBoost = async () => {
    setIsProcessing(true);
    haptic.impact('heavy');

    try {
      const createRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productType: 'BOOST',
          productId: selectedBoost,
          paymentMethod: 'STARS',
        }),
      });
      const data = await createRes.json();
      if (!data.success) throw new Error(data.error);

      if (data.payment?.invoiceLink && (window as any).Telegram?.WebApp?.openInvoice) {
        (window as any).Telegram.WebApp.openInvoice(data.payment.invoiceLink, async (status: string) => {
          if (status === 'paid') {
            haptic.notification('success');
            alert('🔥 Profilingiz 1-oʻringa koʻtarildi (Boost faollashtirildi)!');
            await refreshUser();
          }
        });
        return;
      }

      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerPaymentId: data.payment.providerPaymentId,
          status: 'PAID',
        }),
      });
      haptic.notification('success');
      alert('🔥 Profilingiz 1-oʻringa koʻtarildi (Boost faollashtirildi)!');
      await refreshUser();
    } catch (e: any) {
      alert('Xatolik: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between font-sans">
      <div>
        {/* Header Back Button */}
        <div className="flex items-center justify-between mb-2 pt-2">
          <button
            onClick={() => {
              haptic.selection();
              navigate(-1);
            }}
            className="p-1.5 rounded-full bg-[#151923] text-[#9AA4B8] hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest text-[#D9A441]">Xizmatlar</span>
          <div className="w-8" />
        </div>

        {/* Tab Switcher: Premium vs Boost */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#151923] border border-white/10 mb-5">
          <button
            onClick={() => {
              haptic.selection();
              setActiveTab('premium');
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'premium'
                ? 'bg-[#D9A441] text-[#0B0D12] shadow-md shadow-amber-500/20'
                : 'text-[#9AA4B8] hover:text-white'
            }`}
          >
            <Crown size={15} />
            <span>Yaqin Premium</span>
          </button>
          <button
            onClick={() => {
              haptic.selection();
              setActiveTab('boost');
            }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'boost'
                ? 'bg-[#FF4F79] text-white shadow-md shadow-rose-500/20'
                : 'text-[#9AA4B8] hover:text-white'
            }`}
          >
            <Zap size={15} />
            <span>Profilni koʻtarish (Boost)</span>
          </button>
        </div>

        {/* TAB 1: YAQIN PREMIUM */}
        {activeTab === 'premium' && (
          <div className="animate-fade-in">
            {/* Hero Crown */}
            <div className="text-center pb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D9A441] to-[#F3C363] text-[#0B0D12] flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/30">
                <Crown size={28} className="fill-[#0B0D12]" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-0.5">
                Yaqin Premium
              </h1>
              <p className="text-[#9AA4B8] text-xs">
                Cheksiz imkoniyatlar bilan koʻproq mosliklar toping.
              </p>
            </div>

            {/* Imtiyozlar ro'yxati */}
            <div className="rounded-2xl bg-[#151923] border border-white/10 p-4 mb-5 space-y-2 shadow-md">
              {premiumFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-stone-200">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-[#D9A441] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* 2x2 Tarif rejalari */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {backendPlans.map((p: any) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedPlan(p.id);
                    }}
                    className={`p-3.5 rounded-[22px] border cursor-pointer relative transition-all ${
                      isSelected
                        ? 'border-[#D9A441] bg-[#D9A441]/15 shadow-lg shadow-amber-500/10 scale-[1.02]'
                        : 'border-white/10 bg-[#151923] hover:bg-white/5'
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-2.5 right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-[#D9A441] text-[#0B0D12] shadow">
                        Eng mashhur
                      </span>
                    )}
                    {p.discountPercentage && (
                      <span className="absolute -top-2.5 left-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FF4F79] text-white shadow">
                        -{p.discountPercentage}%
                      </span>
                    )}

                    <h4 className="text-xs font-bold text-white mb-0.5">{p.titleUz}</h4>
                    <div className="text-sm font-black text-[#D9A441]">
                      {p.priceUzs.toLocaleString()} soʻm
                    </div>
                    <div className="text-[10px] text-[#9AA4B8]">{p.starsAmount} Stars</div>
                  </div>
                );
              })}
            </div>

            {/* Premium Obuna tugmasi */}
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9A441] to-[#E6B758] text-[#0B0D12] font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all disabled:opacity-50"
            >
              <Sparkles size={18} />
              <span>{isProcessing ? 'Bajarilmoqda...' : 'Premiumni yoqish'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: PROFILNI KO'TARISH (BOOST) */}
        {activeTab === 'boost' && (
          <div className="animate-fade-in">
            {/* Hero Zap */}
            <div className="text-center pb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF4F79] to-[#FF2A5B] text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-rose-500/30">
                <Zap size={28} className="fill-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-0.5">
                Profilni koʻtarish (Boost)
              </h1>
              <p className="text-[#9AA4B8] text-xs">
                Profilingizni lentada 1-oʻringa olib chiqing va 5x koʻproq like oling!
              </p>
            </div>

            {/* Boost imtiyozlari */}
            <div className="rounded-2xl bg-[#151923] border border-white/10 p-4 mb-5 space-y-2 shadow-md">
              {boostFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-stone-200">
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 text-[#FF4F79] flex items-center justify-center flex-shrink-0">
                    <Flame size={12} className="fill-[#FF4F79]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Boost Variantlari */}
            <div className="space-y-2.5 mb-5">
              {backendBoosts.map((b: any) => {
                const isSelected = selectedBoost === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedBoost(b.id);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#FF4F79] bg-[#FF4F79]/15 shadow-lg shadow-rose-500/10 scale-[1.01]'
                        : 'border-white/10 bg-[#151923] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#FF4F79] text-white' : 'bg-white/5 text-[#9AA4B8]'}`}>
                        <Zap size={20} className={isSelected ? 'fill-white' : ''} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{b.titleUz}</h4>
                          {b.isPopular && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF4F79] text-white">
                              Tavsiya
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9AA4B8]">{b.multiplier}x tezkor koʻrishlar</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-[#FF4F79]">
                        {b.priceUzs.toLocaleString()} soʻm
                      </div>
                      <div className="text-[10px] text-[#9AA4B8]">{b.starsAmount} Stars</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Boost tugmasi */}
            <button
              onClick={handleBuyBoost}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4F79] to-[#FF2A5B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-500/30 active:scale-98 transition-all disabled:opacity-50"
            >
              <Zap size={18} className="fill-white" />
              <span>{isProcessing ? 'Bajarilmoqda...' : 'Boostni faollashtirish'}</span>
            </button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

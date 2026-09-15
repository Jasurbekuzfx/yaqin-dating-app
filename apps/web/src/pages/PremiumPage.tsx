import React, { useState } from 'react';
import { Sparkles, Check, Zap, Star, ShieldCheck } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const PremiumPage: React.FC = () => {
  const { token, refreshUser, user } = useAuth();
  const { haptic } = useTelegram();

  const [selectedPlan, setSelectedPlan] = useState('plan_1_month');
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    'Cheksiz Like bosish imkoniyati',
    'Kim sizni yoqtirganini (Likes) koʻrish',
    'Kengaytirilgan qidiruv filtrlari',
    'Har kuni bepul Super Likelar',
    'Profilingizni 1-oʻringa koʻtarish (Boost)',
    'Reklamasiz qulay foydalanish',
    'Profilingizda oltin Premium nishoni',
  ];

  const plans = [
    { id: 'plan_7_days', title: '7 kun', price: '15 000 soʻm', stars: '75 Stars', durationDays: 7 },
    { id: 'plan_1_month', title: '1 oy', price: '39 000 soʻm', stars: '195 Stars', isPopular: true, durationDays: 30 },
    { id: 'plan_3_months', title: '3 oy', price: '89 000 soʻm', stars: '445 Stars', discount: '-25%', durationDays: 90 },
    { id: 'plan_1_year', title: '1 yil', price: '299 000 soʻm', stars: '1495 Stars', discount: '-40%', durationDays: 365 },
  ];

  const handleSubscribe = async () => {
    setIsProcessing(true);
    haptic.impact('heavy');

    try {
      // 1. To'lov yaratish
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

      // 2. To'lovni tasdiqlash (mock / dev verify)
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
          productId: 'boost_1_hour',
          paymentMethod: 'STARS',
        }),
      });
      const data = await createRes.json();
      if (data.success) {
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerPaymentId: data.payment.providerPaymentId,
            status: 'PAID',
          }),
        });
        haptic.notification('success');
        alert('🔥 Profilingiz 1 soatga 1-oʻringa koʻtarildi (Boost)!');
        await refreshUser();
      }
    } catch (e: any) {
      alert('Xatolik: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-yaqin-bg text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Banner */}
        <div className="text-center pt-2 pb-6">
          <div className="w-16 h-16 rounded-3xl gold-gradient text-yaqin-bg flex items-center justify-center mx-auto mb-3 shadow-xl shadow-amber-500/20">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight gold-text mb-1">
            Yaqin Premium
          </h1>
          <p className="text-yaqin-muted text-xs max-w-xs mx-auto">
            Cheklovsiz imkoniyatlar bilan oʻzingizga mos insonni tezroq toping.
          </p>
        </div>

        {/* Imtiyozlar ro'yxati */}
        <div className="glass-panel rounded-3xl p-5 mb-6 space-y-2.5">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs font-medium text-slate-200">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-yaqin-accent flex items-center justify-center flex-shrink-0">
                <Check size={13} className="stroke-[3]" />
              </div>
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Tarif rejalari */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {plans.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  haptic.selection();
                  setSelectedPlan(p.id);
                }}
                className={`p-4 rounded-3xl border cursor-pointer relative transition-all ${
                  isSelected
                    ? 'border-yaqin-accent bg-yaqin-accent/15 shadow-lg shadow-amber-500/15 scale-[1.02]'
                    : 'border-yaqin-border bg-yaqin-surface/60 hover:bg-yaqin-surface'
                }`}
              >
                {p.isPopular && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full gold-gradient text-yaqin-bg shadow">
                    OMMABOP
                  </span>
                )}
                {p.discount && (
                  <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow">
                    {p.discount}
                  </span>
                )}

                <h4 className="text-sm font-bold text-white mb-1">{p.title}</h4>
                <div className="text-base font-extrabold text-yaqin-accent">{p.price}</div>
                <div className="text-[10px] text-yaqin-muted">{p.stars}</div>
              </div>
            );
          })}
        </div>

        {/* Obuna tugmasi */}
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl gold-gradient text-yaqin-bg font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50 mb-6"
        >
          <Sparkles size={18} />
          <span>{isProcessing ? 'Bajarilmoqda...' : 'Obunani faollashtirish'}</span>
        </button>

        {/* Alohida Tezkor Boost Imkoniyati */}
        <div className="p-4 rounded-3xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <Zap size={22} className="fill-rose-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Profilni 1-oʻringa chiqarish</h4>
              <p className="text-[10px] text-yaqin-muted">1 soatga 5x koʻproq koʻrishlar (10 000 soʻm)</p>
            </div>
          </div>
          <button
            onClick={handleBuyBoost}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            Boost
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

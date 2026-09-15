import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Heart, MessageCircle, DollarSign, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const token = localStorage.getItem('yaqin_admin_token');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Statistikani yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const stats = data?.stats;

  if (isLoading) {
    return <div className="p-8 text-slate-400">Statistika yuklanmoqda...</div>;
  }

  const statCards = [
    { title: 'Jami Foydalanuvchilar', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Bugun Yangi Qoʻshilgan', value: stats?.newUsersToday || 0, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Haftalik Faol Foydalanuvchilar', value: stats?.activeUsers || 0, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Premium Obunachilar', value: stats?.premiumUsers || 0, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'Jami Yoqtirishlar (Likes)', value: stats?.totalLikes || 0, icon: Heart, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { title: 'Hosillangan Matchlar', value: stats?.totalMatches || 0, icon: MessageCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Jami Tushum (UZS)', value: `${(stats?.totalRevenueUzs || 0).toLocaleString()} soʻm`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Telegram Stars Tushumi', value: `${stats?.totalStars || 0} ⭐`, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Kutilayotgan Shikoyatlar', value: stats?.pendingReports || 0, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { title: 'Kutilayotgan Verifikatsiyalar', value: stats?.pendingVerifications || 0, icon: CheckCircle2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Boshqaruv Paneli</h1>
          <p className="text-slate-400 text-sm">Yaqin platformasi faoliyatining real-vaqtdagi koʻrsatkichlari</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
        >
          Yangilash
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{card.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

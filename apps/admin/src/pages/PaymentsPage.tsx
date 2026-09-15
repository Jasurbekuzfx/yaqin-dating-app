import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const token = localStorage.getItem('yaqin_admin_token');

  const { data, isLoading } = useQuery({
    queryKey: ['adminPayments'],
    queryFn: async () => {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const payments = data?.payments || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Toʻlovlar Tarixi</h1>
        <p className="text-slate-400 text-sm">Barcha amalga oshirilgan va kutilayotgan tranzaksiyalar auditi</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Foydalanuvchi</th>
              <th className="p-4">Mahsulot</th>
              <th className="p-4">Miqdor</th>
              <th className="p-4">Provayder</th>
              <th className="p-4">Status</th>
              <th className="p-4">Sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Toʻlovlar mavjud emas
                </td>
              </tr>
            ) : (
              payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-all">
                  <td className="p-4">
                    <div className="font-bold text-white">{p.user?.firstName || 'Nomaʼlum'}</div>
                    <span className="text-slate-500 text-[11px]">ID: {p.user?.telegramId}</span>
                  </td>
                  <td className="p-4 font-semibold text-amber-400">{p.productType}</td>
                  <td className="p-4 font-mono font-bold text-white">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{p.provider}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                        p.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'PENDING'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

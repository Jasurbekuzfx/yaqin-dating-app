import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Check, X } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const token = localStorage.getItem('yaqin_admin_token');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: 'RESOLVED' | 'DISMISSED' }) => {
      await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    },
  });

  const reports = data?.reports || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Shikoyatlar (Reports)</h1>
        <p className="text-slate-400 text-sm">Foydalanuvchilar yuborgan shikoyatlarni koʻrib chiqish</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-slate-500">Yuklanmoqda...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            Hozircha shikoyatlar mavjud emas
          </div>
        ) : (
          reports.map((r: any) => (
            <div key={r.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">Shikoyat sababi: {r.reason}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">
                    Daʼvogar: <span className="text-slate-200 font-medium">{r.reporter.firstName}</span> ➔
                    Ayblanuvchi: <span className="text-rose-400 font-medium">{r.reported.firstName}</span>
                  </p>
                  {r.description && (
                    <p className="text-xs text-slate-300 italic bg-slate-950 p-2 rounded-lg mt-1 border border-slate-800">
                      "{r.description}"
                    </p>
                  )}
                </div>
              </div>

              {r.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ reportId: r.id, status: 'RESOLVED' })}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500/25"
                  >
                    <Check size={14} />
                    <span>Hal qilindi</span>
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ reportId: r.id, status: 'DISMISSED' })}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-1 hover:bg-slate-700"
                  >
                    <X size={14} />
                    <span>Rad etish</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

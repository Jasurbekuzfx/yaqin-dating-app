import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Check, X } from 'lucide-react';

export const VerificationsPage: React.FC = () => {
  const token = localStorage.getItem('yaqin_admin_token');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminVerifications'],
    queryFn: async () => {
      const res = await fetch('/api/admin/verifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ verificationId, status }: { verificationId: string; status: 'APPROVED' | 'REJECTED' }) => {
      await fetch(`/api/admin/verifications/${verificationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const verifications = data?.verifications || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Profil Verifikatsiyasi</h1>
        <p className="text-slate-400 text-sm">Foydalanuvchilarning selfie arizalarini tekshirish va koʻk nishon berish</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="text-slate-500">Yuklanmoqda...</div>
        ) : verifications.length === 0 ? (
          <div className="col-span-3 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
            Kutilayotgan verifikatsiya arizalari mavjud emas
          </div>
        ) : (
          verifications.map((v: any) => (
            <div key={v.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-white text-sm">{v.user.firstName} {v.user.lastName || ''}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    v.status === 'PENDING' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {v.status}
                  </span>
                </div>

                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800">
                  <img src={v.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                </div>
              </div>

              {v.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => reviewMutation.mutate({ verificationId: v.id, status: 'APPROVED' })}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-400 active:scale-95 transition-all"
                  >
                    <Check size={14} />
                    <span>Tasdiqlash</span>
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ verificationId: v.id, status: 'REJECTED' })}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-700 active:scale-95 transition-all"
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

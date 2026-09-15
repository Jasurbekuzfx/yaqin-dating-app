import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const token = localStorage.getItem('yaqin_admin_token');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?search=${search}&page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBanned }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const users = data?.users || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Foydalanuvchilar</h1>
          <p className="text-slate-400 text-sm">Barcha roʻyxatdan oʻtgan foydalanuvchilarni boshqarish</p>
        </div>

        <div className="relative w-72">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Qidirish (ism, telegramId)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Foydalanuvchi</th>
              <th className="p-4">Telegram ID</th>
              <th className="p-4">Jinsi / Shahri</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-800/50 transition-all">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex-shrink-0">
                      <img
                        src={u.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={u.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{u.firstName} {u.lastName || ''}</span>
                        {u.isVerified && <CheckCircle2 size={14} className="text-sky-400" />}
                        {u.isPremium && <span className="text-[10px] text-amber-400 font-extrabold">⭐</span>}
                      </div>
                      <span className="text-slate-500 text-[11px]">@{u.username || 'username_yoq'}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{u.telegramId}</td>
                  <td className="p-4">
                    <div>{u.gender === 'MALE' ? 'Erkak' : 'Ayol'}</div>
                    <span className="text-slate-500 text-[11px]">{u.cityName}</span>
                  </td>
                  <td className="p-4">
                    {u.isBanned ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold text-[10px]">
                        BLOKLANGAN
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
                        FAOL
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => verifyMutation.mutate({ userId: u.id, isVerified: !u.isVerified })}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs border ${
                        u.isVerified
                          ? 'border-slate-700 bg-slate-800 text-slate-300'
                          : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      {u.isVerified ? 'Tasdiqni bekor qilish' : 'Verifikatsiya'}
                    </button>

                    <button
                      onClick={() => banMutation.mutate({ userId: u.id, isBanned: !u.isBanned })}
                      className={`px-3 py-1.5 rounded-lg font-medium text-xs border ${
                        u.isBanned
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
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

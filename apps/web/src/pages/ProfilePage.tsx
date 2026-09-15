import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Sparkles, MapPin, Edit3, Settings, ShieldCheck, Camera, Plus, Trash2 } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const { haptic } = useTelegram();

  const [isVerifying, setIsVerifying] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const res = await fetch('/api/profile/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Profilni yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const profile = data?.profile;

  // Yangi rasm qo'shish
  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic.impact('light');
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/profile/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        haptic.notification('success');
        refetch();
        refreshUser();
      }
    } catch (err) {
      console.error('Rasm yuklashda xatolik:', err);
    }
  };

  // Rasmni o'chirish
  const handleDeletePhoto = async (id: string) => {
    if (confirm('Fotosuratni oʻchirmoqchimisiz?')) {
      haptic.impact('medium');
      await fetch(`/api/profile/photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
      refreshUser();
    }
  };

  // Verifikatsiya uchun selfie yuklash
  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifying(true);
    const formData = new FormData();
    formData.append('selfie', file);

    try {
      const res = await fetch('/api/verification/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        haptic.notification('success');
        alert('Tasdiqlash arizangiz qabul qilindi. Tez orada koʻrib chiqiladi!');
      }
    } catch (e) {
      alert('Xatolik yuz berdi');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-yaqin-bg flex items-center justify-center text-yaqin-muted text-sm">
        Yuklanmoqda...
      </div>
    );
  }

  const primaryPhoto = profile.photos.find((p: any) => p.isPrimary) || profile.photos[0];

  return (
    <div className="min-h-screen bg-yaqin-bg text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Sarlavha & Sozlamalar tugmasi */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tight">Mening profilim</h1>
          <button
            onClick={() => {
              haptic.selection();
              navigate('/settings');
            }}
            className="p-2 rounded-full bg-yaqin-surface border border-yaqin-border text-yaqin-muted hover:text-white"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Asosiy Profil Kartasi */}
        <div className="p-5 rounded-3xl bg-yaqin-surface border border-yaqin-border mb-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-yaqin-accent relative flex-shrink-0">
              <img
                src={primaryPhoto?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt={profile.firstName}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-xl font-black text-white">
                  {profile.firstName}, {profile.age}
                </h2>
                {profile.isVerified && (
                  <CheckCircle2 size={18} className="text-sky-400 fill-sky-400/20" />
                )}
                {profile.isPremium && (
                  <span className="p-0.5 rounded-full gold-gradient text-yaqin-bg">
                    <Sparkles size={12} />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-yaqin-muted text-xs mb-2">
                <MapPin size={13} className="text-rose-400" />
                <span>{profile.cityName || 'Oʻzbekiston'}</span>
              </div>

              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                {profile.gender === 'MALE' ? 'Erkak 👨' : 'Ayol 👩'}
              </span>
            </div>
          </div>

          {profile.bio && (
            <p className="text-xs text-slate-300 leading-relaxed bg-yaqin-bg/60 p-3 rounded-2xl border border-white/5 mb-3">
              {profile.bio}
            </p>
          )}

          {/* Verifikatsiya arizasi statusi */}
          {!profile.isVerified && (
            <label className="flex items-center justify-between p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 cursor-pointer">
              <div className="flex items-center gap-2 text-sky-400">
                <ShieldCheck size={18} />
                <span className="text-xs font-bold">Profilni tasdiqlash (Koʻk nishon)</span>
              </div>
              <span className="text-[11px] font-semibold bg-sky-500 text-yaqin-bg px-2.5 py-1 rounded-xl">
                {isVerifying ? 'Yuklanmoqda...' : 'Selfie yuklash'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleVerificationUpload}
                className="hidden"
                disabled={isVerifying}
              />
            </label>
          )}
        </div>

        {/* Fotosuratlar Galereyasi */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider">
              Fotosuratlar ({profile.photos.length}/6)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {profile.photos.map((photo: any) => (
              <div
                key={photo.id}
                className="aspect-square rounded-2xl overflow-hidden relative border border-yaqin-border group"
              >
                <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
                {profile.photos.length > 1 && (
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            {profile.photos.length < 6 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-yaqin-border hover:border-yaqin-accent bg-yaqin-surface/40 flex flex-col items-center justify-center cursor-pointer text-yaqin-muted hover:text-white transition-all">
                <Plus size={24} />
                <span className="text-[10px] font-medium mt-1">Qoʻshish</span>
                <input type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Qiziqishlar */}
        {profile.interests?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-yaqin-muted uppercase tracking-wider mb-2.5">
              Qiziqishlar
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((it: any) => (
                <span
                  key={it.id}
                  className="px-3 py-1.5 rounded-xl bg-yaqin-surface border border-yaqin-border text-xs font-medium text-slate-200"
                >
                  {it.icon} {it.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Sparkles, MapPin, Settings, ShieldCheck, Plus, Trash2, ArrowLeft, X, Check, Edit3, Zap, Crown } from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, refreshUser, user } = useAuth();
  const { haptic } = useTelegram();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCityId, setEditCityId] = useState('');
  const [editLookingFor, setEditLookingFor] = useState<'MALE' | 'FEMALE' | 'ALL'>('ALL');
  const [editInterests, setEditInterests] = useState<string[]>([]);

  // Config data
  const [cities, setCities] = useState<{ id: string; name: string; region?: string }[]>([]);
  const [availableInterests, setAvailableInterests] = useState<{ id: string; name: string; icon?: string }[]>([]);

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

  const profile = data?.profile || (user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    age: 22,
    cityId: '',
    cityName: 'Toshkent',
    cityRegion: 'Toshkent shahri',
    bio: '',
    isVerified: user.isVerified,
    isPremium: user.isPremium,
    photos: [],
    interests: [],
  } : null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/profile/config');
        if (res.ok) {
          const cfg = await res.json();
          setCities(cfg.cities || []);
          setAvailableInterests(cfg.interests || []);
        }
      } catch (e) {
        console.error('Config error:', e);
      }
    };
    fetchConfig();
  }, []);

  const openEditModal = () => {
    if (profile) {
      setEditFirstName(profile.firstName || '');
      setEditBio(profile.bio || '');
      setEditCityId(profile.cityId || (cities[0]?.id ?? ''));
      setEditLookingFor(profile.lookingFor || 'ALL');
      setEditInterests(profile.interests?.map((it: any) => it.id) || []);
      setIsEditModalOpen(true);
      haptic.selection();
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    haptic.impact('medium');
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          bio: editBio.trim(),
          cityId: editCityId,
          lookingFor: editLookingFor,
          interestIds: editInterests,
        }),
      });
      if (res.ok) {
        haptic.notification('success');
        setIsEditModalOpen(false);
        refetch();
        refreshUser();
      }
    } catch (e) {
      console.error('Profile update error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterestToggle = (id: string) => {
    haptic.selection();
    if (editInterests.includes(id)) {
      setEditInterests(editInterests.filter((it) => it !== id));
    } else {
      if (editInterests.length < 8) {
        setEditInterests([...editInterests, id]);
      }
    }
  };

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
    } catch {
      alert('Xatolik yuz berdi');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B0D12] flex flex-col items-center justify-center text-center p-6 text-white font-sans">
        <div className="w-12 h-12 rounded-full border-2 border-[#FF4F79] border-t-transparent animate-spin mb-4" />
        <p className="text-stone-300 text-sm font-semibold mb-2">Profil maʼlumotlari yuklanmoqda...</p>
        <button
          onClick={() => {
            haptic.impact('light');
            refetch();
          }}
          className="mt-2 px-5 py-2.5 rounded-2xl bg-[#151923] border border-white/15 text-xs text-[#FF4F79] font-bold hover:bg-[#151923]/80"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const primaryPhoto = profile.photos?.find((p: any) => p.isPrimary) || profile.photos?.[0];

  return (
    <div className="min-h-screen bg-[#0B0D12] text-white pb-24 max-w-md mx-auto p-4 flex flex-col justify-between font-sans relative">
      <div>
        {/* Sarlavha & Sozlamalar */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                haptic.selection();
                navigate('/discover');
              }}
              className="p-1 text-[#9AA4B8] hover:text-white"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-xl font-black tracking-tight text-white">Mening profilim</h1>
          </div>

          <button
            onClick={() => {
              haptic.selection();
              navigate('/settings');
            }}
            className="p-2 rounded-full bg-[#151923] border border-white/10 text-[#9AA4B8] hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* 1. Katta Hero Fotosurat */}
        <div className="aspect-[4/3.8] rounded-[28px] overflow-hidden border border-white/10 mb-3 relative shadow-2xl bg-[#151923]">
          <img
            src={
              primaryPhoto?.url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
            }
            alt={profile.firstName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. Fotosuratlar Galereyasi */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {profile.photos?.map((photo: any) => (
            <div
              key={photo.id}
              className="w-16 h-16 rounded-2xl overflow-hidden relative border border-white/10 flex-shrink-0 group bg-[#151923] shadow-md"
            >
              <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
              {profile.photos.length > 1 && (
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-500"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}

          {(!profile.photos || profile.photos.length < 6) && (
            <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#FF4F79] bg-[#151923] flex flex-col items-center justify-center cursor-pointer text-[#9AA4B8] hover:text-[#FF4F79] flex-shrink-0 transition-all shadow-md">
              <Plus size={20} />
              <input type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
            </label>
          )}
        </div>

        {/* 3. Ism, Yosh va "Profilni tahrirlash" tugmasi */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-black text-white">
              {profile.firstName}, {profile.age}
            </h2>
            {profile.isVerified && (
              <CheckCircle2 size={20} className="text-sky-400 fill-sky-400/20" />
            )}
            {profile.isPremium && (
              <span className="p-1 rounded-full bg-[#D9A441] text-[#0B0D12] shadow-sm">
                <Sparkles size={12} />
              </span>
            )}
          </div>

          <button
            onClick={openEditModal}
            className="px-3.5 py-1.5 rounded-full bg-[#FF4F79]/15 border border-[#FF4F79]/40 text-[#FF4F79] text-xs font-bold hover:bg-[#FF4F79]/25 transition-all flex items-center gap-1.5"
          >
            <Edit3 size={13} />
            <span>Tahrirlash</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[#9AA4B8] text-xs mb-3 font-semibold">
          <MapPin size={13} className="text-[#FF4F79]" />
          <span>{profile.cityName || 'Toshkent'}</span>
          {profile.cityRegion && <span className="text-stone-400">({profile.cityRegion})</span>}
        </div>

        {/* 4. Bio matni */}
        {profile.bio && (
          <p className="text-stone-200 text-xs leading-relaxed bg-[#151923] p-3.5 rounded-2xl border border-white/10 mb-4 shadow-md">
            “{profile.bio}”
          </p>
        )}

        {/* 5. Qiziqishlar Teglari */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((it: any) => (
                <span
                  key={it.id}
                  className="px-3 py-1.5 rounded-2xl bg-[#151923] border border-white/10 text-xs font-bold text-stone-200 shadow-sm"
                >
                  {it.icon} {it.name}
                </span>
              ))}
              <button
                onClick={openEditModal}
                className="w-8 h-8 rounded-2xl bg-[#151923] border border-white/10 text-[#9AA4B8] flex items-center justify-center hover:text-[#FF4F79] font-bold"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 6. Boost & Premium Harakat Kartalari */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Boost Card */}
          <button
            onClick={() => {
              haptic.selection();
              navigate('/premium?tab=boost');
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FF4F79]/15 to-[#FF4F79]/5 border border-[#FF4F79]/30 text-left relative overflow-hidden group active:scale-98 transition-all shadow-md"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF4F79] text-white flex items-center justify-center mb-2 shadow-md shadow-rose-500/20">
              <Zap size={16} className="fill-white" />
            </div>
            <h4 className="text-xs font-black text-white mb-0.5">Profilni koʻtarish</h4>
            <p className="text-[10px] text-stone-400 font-medium">5x tezkor koʻrishlar (Boost)</p>
          </button>

          {/* Premium Card */}
          <button
            onClick={() => {
              haptic.selection();
              navigate('/premium?tab=premium');
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-[#D9A441]/15 to-[#D9A441]/5 border border-[#D9A441]/30 text-left relative overflow-hidden group active:scale-98 transition-all shadow-md"
          >
            <div className="w-8 h-8 rounded-xl bg-[#D9A441] text-[#0B0D12] flex items-center justify-center mb-2 shadow-md shadow-amber-500/20">
              <Crown size={16} className="fill-[#0B0D12]" />
            </div>
            <h4 className="text-xs font-black text-white mb-0.5">Yaqin Premium</h4>
            <p className="text-[10px] text-stone-400 font-medium">Cheksiz like va imtiyozlar</p>
          </button>
        </div>

        {/* Verifikatsiya arizasi statusi */}
        {!profile.isVerified && (
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 cursor-pointer mb-3">
            <div className="flex items-center gap-2 text-sky-400">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold">Profilni tasdiqlash (Koʻk nishon)</span>
            </div>
            <span className="text-[11px] font-bold bg-sky-500 text-white px-3 py-1 rounded-xl">
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

      {/* Edit Profile Bottom Sheet Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 animate-fade-in">
          <div className="w-full max-w-md bg-[#151923] border-t border-white/15 rounded-t-[32px] p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">Profilni tahrirlash</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-[#9AA4B8] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Ismingiz
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0B0D12] border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-[#FF4F79]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Viloyat / Shahar / Tuman
                </label>
                <select
                  value={editCityId}
                  onChange={(e) => setEditCityId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#0B0D12] border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-[#FF4F79]"
                >
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

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Kimni qidiryapsiz?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'FEMALE', label: '👩 Ayollar' },
                    { val: 'MALE', label: '👨 Erkaklar' },
                    { val: 'ALL', label: '👩‍❤️‍👨 Barchasi' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setEditLookingFor(item.val as any)}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                        editLookingFor === item.val
                          ? 'border-[#FF4F79] bg-[#FF4F79]/20 text-[#FF4F79]'
                          : 'border-white/10 bg-[#0B0D12] text-[#9AA4B8]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Bio (Oʻzingiz haqingizda)
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Xarakteringiz va qiziqishlaringiz haqida..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#0B0D12] border border-white/10 text-white placeholder-[#8E8B99] font-medium text-xs focus:outline-none focus:border-[#FF4F79] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1.5">
                  Qiziqishlaringiz
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableInterests.map((item) => {
                    const isSelected = editInterests.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInterestToggle(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'border-[#FF4F79] bg-[#FF4F79] text-white'
                            : 'border-white/10 bg-[#0B0D12] text-stone-300'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full py-3.5 rounded-2xl bg-[#FF4F79] hover:bg-[#E03A5B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all disabled:opacity-50"
              >
                <Check size={16} />
                <span>{isSaving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Camera, Check, UploadCloud, Heart, Sparkles, MapPin, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';
import { isAtLeast18YearsOld } from '@yaqin/shared';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const { haptic } = useTelegram();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [lookingFor, setLookingFor] = useState<'MALE' | 'FEMALE' | 'ALL'>('MALE');
  const [birthDate, setBirthDate] = useState('2002-01-01');
  const [cityId, setCityId] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Config data (shaharlar va qiziqishlar)
  const [cities, setCities] = useState<{ id: string; name: string; region?: string }[]>([]);
  const [interests, setInterests] = useState<{ id: string; name: string; icon?: string }[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/profile/config');
        if (res.ok) {
          const data = await res.json();
          setCities(data.cities || []);
          setInterests(data.interests || []);
          if (data.cities?.length > 0) {
            setCityId(data.cities[0].id);
          }
        }
      } catch (e) {
        console.error('Config olishda xatolik:', e);
      }
    };
    fetchConfig();
  }, []);

  const handleInterestToggle = (id: string) => {
    haptic.selection();
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== id));
    } else {
      if (selectedInterests.length < 8) {
        setSelectedInterests([...selectedInterests, id]);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic.impact('light');
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/profile/photos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.photo) {
        setUploadedPhotos([...uploadedPhotos, data.photo.url]);
      } else {
        setError(data.error || 'Rasm yuklashda xatolik');
      }
    } catch (err) {
      setError('Rasm yuklab boʻlmadi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setError(null);
    haptic.impact('light');

    if (step === 1 && !firstName.trim()) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }

    if (step === 2 && !gender) {
      setError('Jinsingizni tanlang');
      return;
    }

    if (step === 3 && !isAtLeast18YearsOld(birthDate)) {
      setError('Platformadan faqat 18 yoshga toʻlgan foydalanuvchilar foydalanishi mumkin');
      return;
    }

    if (step === 5 && uploadedPhotos.length === 0) {
      setError('Kamida 1 ta fotosurat yuklashingiz kerak');
      return;
    }

    if (step < 6) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);
    haptic.impact('heavy');

    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          gender,
          lookingFor,
          birthDate,
          cityId: cityId || (cities[0]?.id ?? ''),
          bio: bio.trim(),
          interestIds: selectedInterests,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshUser();
        navigate('/discover');
      } else {
        setError(data.error || 'Profilni saqlashda xatolik');
      }
    } catch (err) {
      setError('Server bilan bogʻlanishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1E28] px-6 py-5 flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Top Bar with Step & Progress */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-3">
          <span className="text-xs font-bold tracking-widest text-[#1E1E28]">
            0{step} <span className="text-[#8E8B99] font-normal">/ 06</span>
          </span>
          <button
            onClick={() => {
              if (step < 6) setStep(step + 1);
              else handleFinish();
            }}
            className="text-xs font-semibold text-[#8E8B99] hover:text-[#FF4B6E] transition-colors"
          >
            Oʻtkazib yuborish
          </button>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-[#EAE5DC] h-1 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#FF4B6E] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center py-2">
        {/* Step 1: Ism */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            {/* Romantic Illustration */}
            <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
              <div className="w-20 h-20 bg-[#FFE4E8] rounded-full flex items-center justify-center">
                <div className="w-12 h-10 bg-[#FF4B6E] rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/30 transform -rotate-6">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
              <div className="absolute top-1 right-2 w-7 h-7 bg-[#FFF0F3] rounded-full flex items-center justify-center border border-[#FFD0D8]">
                <Heart className="w-3.5 h-3.5 text-[#FF4B6E] fill-[#FF4B6E]" />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#1E1E28] mb-2">
              Avval sizni tanib olaylik
            </h1>
            <p className="text-[#8E8B99] text-xs font-medium leading-relaxed max-w-xs mx-auto mb-8">
              Yangi insonlar bilan tanishish uchun bir necha savolga javob bering.
            </p>

            <div className="text-left mb-4">
              <label className="text-xs font-bold text-[#1E1E28] mb-2 block">
                Ismingiz nima?
              </label>
              <input
                type="text"
                placeholder="Ismingizni kiriting"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
                className="w-full px-4 py-4 rounded-2xl bg-white border border-[#EAE5DC] text-[#1E1E28] placeholder-[#B5B2BE] font-medium text-sm focus:outline-none focus:border-[#FF4B6E] shadow-sm transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 2: Jins va Kimni qidiryapsiz */}
        {step === 2 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-5 bg-[#FFE4E8] rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-[#FF4B6E]" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#1E1E28] mb-2">
              Kim bilan tanishmoqchisiz?
            </h1>
            <p className="text-[#8E8B99] text-xs font-medium leading-relaxed mb-6">
              Sizga mos profillarni tavsiya qilishimiz uchun
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-[#1E1E28] mb-2 block">
                  Sizning jinsingiz:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('FEMALE');
                      setLookingFor('MALE');
                    }}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                      gender === 'FEMALE'
                        ? 'border-[#FF4B6E] bg-white text-[#FF4B6E] shadow-md shadow-rose-500/10'
                        : 'border-[#EAE5DC] bg-white text-[#8E8B99]'
                    }`}
                  >
                    <span>👩</span> Ayol
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('MALE');
                      setLookingFor('FEMALE');
                    }}
                    className={`py-3.5 px-4 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                      gender === 'MALE'
                        ? 'border-[#FF4B6E] bg-white text-[#FF4B6E] shadow-md shadow-rose-500/10'
                        : 'border-[#EAE5DC] bg-white text-[#8E8B99]'
                    }`}
                  >
                    <span>👨</span> Erkak
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1E1E28] mb-2 block">
                  Kimni qidiryapsiz?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLookingFor('FEMALE')}
                    className={`py-3 rounded-2xl font-bold text-[11px] border transition-all ${
                      lookingFor === 'FEMALE'
                        ? 'border-[#FF4B6E] bg-white text-[#FF4B6E] shadow-sm'
                        : 'border-[#EAE5DC] bg-white text-[#8E8B99]'
                    }`}
                  >
                    👩 Ayollar
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingFor('MALE')}
                    className={`py-3 rounded-2xl font-bold text-[11px] border transition-all ${
                      lookingFor === 'MALE'
                        ? 'border-[#FF4B6E] bg-white text-[#FF4B6E] shadow-sm'
                        : 'border-[#EAE5DC] bg-white text-[#8E8B99]'
                    }`}
                  >
                    👨 Erkaklar
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingFor('ALL')}
                    className={`py-3 rounded-2xl font-bold text-[11px] border transition-all ${
                      lookingFor === 'ALL'
                        ? 'border-[#FF4B6E] bg-white text-[#FF4B6E] shadow-sm'
                        : 'border-[#EAE5DC] bg-white text-[#8E8B99]'
                    }`}
                  >
                    👩‍❤️‍👨 Barchasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Yosh va Shahar */}
        {step === 3 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-5 bg-[#FFE4E8] rounded-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-[#FF4B6E]" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#1E1E28] mb-2">
              Qayerdansiz?
            </h1>
            <p className="text-[#8E8B99] text-xs font-medium leading-relaxed mb-6">
              Yaqiningizdagi insonlar bilan tanishish uchun
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-[#1E1E28] mb-2 block">
                  Viloyat / Shahar / Tuman
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#EAE5DC] text-[#1E1E28] font-medium text-sm focus:outline-none focus:border-[#FF4B6E] shadow-sm max-h-60"
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
                <label className="text-xs font-bold text-[#1E1E28] mb-2 block">
                  Tugʻilgan sanangiz (18+)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#EAE5DC] text-[#1E1E28] font-medium text-sm focus:outline-none focus:border-[#FF4B6E] shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Qiziqishlar va Bio */}
        {step === 4 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#FFE4E8] rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-[#FF4B6E]" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#1E1E28] mb-1">
              Qiziqishlaringiz
            </h1>
            <p className="text-[#8E8B99] text-xs font-medium mb-4">
              Oʻzingizga yoqadigan mashgʻulotlarni tanlang (kamida 3 ta)
            </p>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 mb-4">
              {interests.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInterestToggle(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-[#FF4B6E] bg-[#FF4B6E] text-white shadow-sm'
                        : 'border-[#EAE5DC] bg-white text-[#1E1E28]'
                    }`}
                  >
                    <span>{item.icon || '✨'}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-left">
              <label className="text-xs font-bold text-[#1E1E28] mb-1 block">
                Bio (Qisqacha oʻzingiz haqingizda)
              </label>
              <textarea
                rows={3}
                placeholder="Xarakteringiz va qiziqishlaringiz haqida yozing..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#EAE5DC] text-[#1E1E28] placeholder-[#B5B2BE] font-medium text-xs focus:outline-none focus:border-[#FF4B6E] shadow-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Fotosuratlar */}
        {step === 5 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 bg-[#FFE4E8] rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-[#FF4B6E]" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#1E1E28] mb-1">
              Yaxshi surat tanlang
            </h1>
            <p className="text-[#8E8B99] text-xs font-medium mb-6">
              Yuzingiz aniq koʻringan kamida 1 ta fotosurat yuklang
            </p>

            <div className="grid grid-cols-2 gap-3 mb-2">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border border-[#EAE5DC] shadow-sm">
                  <img src={url} alt="Yuklangan" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-[#FF4B6E] text-white shadow">
                    <Check size={12} />
                  </span>
                </div>
              ))}

              {uploadedPhotos.length < 6 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-[#FFB8C6] hover:border-[#FF4B6E] bg-white flex flex-col items-center justify-center cursor-pointer p-4 text-center transition-colors">
                  <UploadCloud size={28} className="text-[#FF4B6E] mb-1" />
                  <span className="text-[11px] font-bold text-[#1E1E28]">Rasm qoʻshish</span>
                  <span className="text-[9px] text-[#8E8B99]">Galereyadan</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Profil Preview */}
        {step === 6 && (
          <div className="text-center animate-fade-in">
            <div className="w-32 h-32 mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4 relative">
              <img
                src={uploadedPhotos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Siz"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#FF4B6E] text-white flex items-center justify-center shadow">
                <Check size={14} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-[#1E1E28] mb-1">
              {firstName || 'Foydalanuvchi'}, 22
            </h2>
            <p className="text-xs font-semibold text-[#FF4B6E] mb-4">
              Profilingiz 100% tayyor! ✨
            </p>
            <div className="p-4 rounded-2xl bg-white border border-[#EAE5DC] text-xs text-[#8E8B99] shadow-sm mb-4 leading-relaxed">
              {bio || 'Yaqin orqali samimiy va ajoyib insonlar bilan tanishishga tayyorman! 🌸'}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#FF4B6E] text-xs text-center font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Button Bar */}
      <div className="pt-4 pb-2">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-[#FF4B6E] hover:bg-[#E03A5B] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-98 transition-all disabled:opacity-50"
        >
          <span>{step === 6 ? 'Tayyor! Tanishuvni boshlash' : 'Keyingi'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ArrowLeft, Camera, Check, UploadCloud } from 'lucide-react';
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
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [lookingFor, setLookingFor] = useState<'MALE' | 'FEMALE' | 'ALL'>('FEMALE');
  const [birthDate, setBirthDate] = useState('2002-01-01');
  const [cityId, setCityId] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // Config data (shaharlar va qiziqishlar)
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
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

    if (step === 1 && !isAdultConfirmed) {
      setError('Davom etish uchun 18+ yosh talabini tasdiqlashingiz kerak');
      return;
    }

    if (step === 2 && !firstName.trim()) {
      setError('Ismingizni kiriting');
      return;
    }

    if (step === 3 && !isAtLeast18YearsOld(birthDate)) {
      setError('Platformadan faqat 18 yoshga toʻlgan foydalanuvchilar foydalanishi mumkin');
      return;
    }

    if (step === 6 && uploadedPhotos.length === 0) {
      setError('Kamida 1 ta fotosurat yuklashingiz kerak');
      return;
    }

    if (step < 7) {
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
          cityId,
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
    <div className="min-h-screen bg-yaqin-bg text-white p-5 flex flex-col justify-between max-w-md mx-auto">
      {/* Yuqori progress bar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="p-2 text-yaqin-muted hover:text-white rounded-full bg-white/5"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <span className="text-xs font-semibold tracking-wider text-yaqin-muted uppercase">
            Bosqich {step} / 7
          </span>
          <div className="w-8" />
        </div>

        <div className="w-full bg-yaqin-surface h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="h-full gold-gradient transition-all duration-300"
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Bosqichlar mazmuni */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* 1-Qadam: 18+ Yosh cheklovi */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-6">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-3xl font-black mb-3">Yaqin’ga xush kelibsiz</h1>
            <p className="text-yaqin-muted text-sm leading-relaxed mb-8">
              Platformadan faqat 18 yoshga toʻlgan voyaga yetgan shaxslar tanishuv maqsadida foydalanishi mumkin.
            </p>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-yaqin-surface border border-yaqin-border text-left cursor-pointer">
              <input
                type="checkbox"
                checked={isAdultConfirmed}
                onChange={(e) => setIsAdultConfirmed(e.target.checked)}
                className="w-5 h-5 accent-yaqin-accent rounded"
              />
              <span className="text-sm font-medium text-slate-200">
                Men 18 yoshdan kattaman va qoidalar bilan roziman
              </span>
            </label>
          </div>
        )}

        {/* 2-Qadam: Ism va Jins */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2">Ismingiz va jinsingiz</h2>
            <p className="text-yaqin-muted text-sm mb-6">Profil kartochkasida koʻrsatiladigan maʼlumotlar</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Ismingiz</label>
                <input
                  type="text"
                  placeholder="Masalan: Sardor"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-yaqin-surface border border-yaqin-border text-white placeholder-slate-500 focus:outline-none focus:border-yaqin-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Sizning jinsingiz</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('MALE')}
                    className={`py-3 rounded-2xl font-semibold text-sm border transition-all ${
                      gender === 'MALE'
                        ? 'border-yaqin-accent bg-yaqin-accent/15 text-yaqin-accent'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-400'
                    }`}
                  >
                    Erkak 👨
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`py-3 rounded-2xl font-semibold text-sm border transition-all ${
                      gender === 'FEMALE'
                        ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-400'
                    }`}
                  >
                    Ayol 👩
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Qadam: Tug'ilgan sana va Kimni qidiryapsiz */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2">Yoshingiz va Qidiruv</h2>
            <p className="text-yaqin-muted text-sm mb-6">Tugʻilgan sanangiz boʻyicha yoshingiz aniqlanadi</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Tugʻilgan sana</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-yaqin-surface border border-yaqin-border text-white focus:outline-none focus:border-yaqin-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Kimni qidiryapsiz?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLookingFor('FEMALE')}
                    className={`py-3 rounded-2xl font-semibold text-xs border transition-all ${
                      lookingFor === 'FEMALE'
                        ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-400'
                    }`}
                  >
                    Qizlarni
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingFor('MALE')}
                    className={`py-3 rounded-2xl font-semibold text-xs border transition-all ${
                      lookingFor === 'MALE'
                        ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-400'
                    }`}
                  >
                    Yigitlarni
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookingFor('ALL')}
                    className={`py-3 rounded-2xl font-semibold text-xs border transition-all ${
                      lookingFor === 'ALL'
                        ? 'border-yaqin-accent bg-yaqin-accent/15 text-yaqin-accent'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-400'
                    }`}
                  >
                    Barchasini
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Qadam: Shahar va Bio */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2">Shahar va Oʻzingiz haqingizda</h2>
            <p className="text-yaqin-muted text-sm mb-6">Yaqiningizdagi insonlar bilan bogʻlanish uchun</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Shahringiz</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-yaqin-surface border border-yaqin-border text-white focus:outline-none focus:border-yaqin-accent"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id} className="bg-yaqin-surface text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-yaqin-muted mb-1 block">Bio (Qisqacha oʻzingiz haqingizda)</label>
                <textarea
                  rows={4}
                  placeholder="Xarakteringiz, mashgʻulotlaringiz va qiziqishlaringiz haqida yozing..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-yaqin-surface border border-yaqin-border text-white placeholder-slate-500 focus:outline-none focus:border-yaqin-accent resize-none text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5-Qadam: Qiziqishlar */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2">Qiziqishlaringiz</h2>
            <p className="text-yaqin-muted text-sm mb-4">Bir xil dunyoqarashdagi insonlarni topish uchun (kamida 3 ta)</p>

            <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
              {interests.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInterestToggle(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-yaqin-accent bg-yaqin-accent text-yaqin-bg font-bold shadow-md shadow-yaqin-accent/20'
                        : 'border-yaqin-border bg-yaqin-surface text-slate-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6-Qadam: Fotosuratlar */}
        {step === 6 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2">Fotosuratingiz</h2>
            <p className="text-yaqin-muted text-sm mb-6">Yuzingiz aniq koʻringan kamida 1 ta rasm yuklang</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {uploadedPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden relative border border-yaqin-border">
                  <img src={url} alt="Yuklangan" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white">
                    <Check size={14} />
                  </span>
                </div>
              ))}

              {uploadedPhotos.length < 6 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-yaqin-border hover:border-yaqin-accent bg-yaqin-surface/50 flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                  <UploadCloud size={32} className="text-yaqin-muted mb-2" />
                  <span className="text-xs font-medium text-slate-300">Rasm qoʻshish</span>
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

        {/* 7-Qadam: Profil preview */}
        {step === 7 && (
          <div className="text-center animate-fade-in">
            <div className="w-32 h-32 mx-auto rounded-3xl overflow-hidden border-2 border-yaqin-accent shadow-2xl mb-4">
              <img
                src={uploadedPhotos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Siz"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-black mb-1">{firstName}</h2>
            <p className="text-yaqin-muted text-sm mb-4">Profil koʻrinishi tayyor!</p>
            <p className="text-xs text-slate-400 bg-yaqin-surface p-4 rounded-2xl border border-yaqin-border mb-6">
              {bio || 'Yaqin orqali ajoyib insonlar bilan tanishishga tayyorman.'}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Pastki Navigatsiya tugmasi */}
      <div>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl gold-gradient text-yaqin-bg font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 active:scale-98 transition-all disabled:opacity-50"
        >
          <span>{step === 7 ? 'Tayyor! Tanishuvni boshlash' : 'Davom etish'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { CheckCircle2, Sparkles, MapPin, Info, Heart, X, Star } from 'lucide-react';
import { DiscoverCandidateDto } from '@yaqin/shared';
import { useTelegram } from '../hooks/useTelegram.js';

interface ProfileCardProps {
  candidate: DiscoverCandidateDto;
  onLike: () => void;
  onSkip: () => void;
  onSuperLike: () => void;
  onOpenDetails: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  candidate,
  onLike,
  onSkip,
  onSuperLike,
  onOpenDetails,
}) => {
  const { haptic } = useTelegram();
  const [photoIndex, setPhotoIndex] = useState(0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Swipe burilish burchagi va badge ko'rinish darajasi
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const photos = candidate.photos.length > 0
    ? candidate.photos
    : [{ id: 'default', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 }];

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      haptic.impact('heavy');
      onLike();
    } else if (info.offset.x < -threshold) {
      haptic.impact('medium');
      onSkip();
    } else if (info.offset.y < -threshold) {
      haptic.impact('heavy');
      onSuperLike();
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    if (photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none bg-yaqin-surface border border-yaqin-border"
    >
      {/* 1. Asosiy Fotosurat */}
      <img
        src={photos[photoIndex]?.url}
        alt={candidate.firstName}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Rasm almashtirish sensor zonalari (chap / o'ng) */}
      <div className="absolute inset-0 flex z-10">
        <div className="w-1/2 h-4/5" onClick={prevPhoto} />
        <div className="w-1/2 h-4/5" onClick={nextPhoto} />
      </div>

      {/* Stories-style foto indikatorlar */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                i === photoIndex ? 'bg-white shadow' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe Badges (Like, Skip, Super Like) */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-6 z-20 border-4 border-emerald-400 bg-emerald-500/20 px-4 py-1.5 rounded-2xl rotate-[-18deg] backdrop-blur-sm"
      >
        <span className="text-2xl font-black text-emerald-400 tracking-wider uppercase">LIKE</span>
      </motion.div>

      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-8 right-6 z-20 border-4 border-rose-500 bg-rose-500/20 px-4 py-1.5 rounded-2xl rotate-[18deg] backdrop-blur-sm"
      >
        <span className="text-2xl font-black text-rose-500 tracking-wider uppercase">SKIP</span>
      </motion.div>

      <motion.div
        style={{ opacity: superLikeOpacity }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20 border-4 border-sky-400 bg-sky-500/20 px-5 py-2 rounded-2xl backdrop-blur-sm"
      >
        <span className="text-2xl font-black text-sky-400 tracking-wider uppercase">SUPER LIKE</span>
      </motion.div>

      {/* Gradient qora qoplama (pastki ma'lumotlar uchun) */}
      <div className="absolute inset-0 bg-gradient-to-t from-yaqin-bg via-yaqin-bg/40 to-transparent pointer-events-none" />

      {/* Profil Ma'lumotlari */}
      <div className="absolute bottom-20 left-0 right-0 p-5 z-20 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {candidate.firstName}, {candidate.age}
          </h2>

          {candidate.isVerified && (
            <CheckCircle2 size={22} className="text-sky-400 fill-sky-400/20" />
          )}
          {candidate.isPremium && (
            <span className="p-1 rounded-full gold-gradient text-yaqin-bg">
              <Sparkles size={14} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-yaqin-muted text-sm mb-2 font-medium">
          <MapPin size={16} className="text-rose-400" />
          <span>{candidate.city}</span>
          {candidate.isBoosted && (
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ TOP
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-slate-200 text-sm line-clamp-2 leading-relaxed mb-3">
            {candidate.bio}
          </p>
        )}

        {/* Tafsilot tugmasi */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.impact('light');
            onOpenDetails();
          }}
          className="pointer-events-auto flex items-center gap-1 text-xs text-slate-300 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full transition-all border border-white/10"
        >
          <Info size={14} />
          <span>Batafsil maʼlumot</span>
        </button>
      </div>

      {/* Pastki Harakat Tugmalari (Actions) */}
      <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-around z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.impact('medium');
            onSkip();
          }}
          className="w-14 h-14 rounded-full bg-yaqin-surface/90 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <X size={28} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.impact('heavy');
            onSuperLike();
          }}
          className="w-12 h-12 rounded-full bg-yaqin-surface/90 border border-sky-400/30 text-sky-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Star size={24} className="fill-sky-400" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.impact('heavy');
            onLike();
          }}
          className="w-14 h-14 rounded-full bg-yaqin-surface/90 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Heart size={28} className="fill-emerald-400" />
        </button>
      </div>
    </motion.div>
  );
};

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

  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-20, -100], [0, 1]);
  const superLikeOpacity = useTransform(y, [-20, -100], [0, 1]);

  const photos =
    candidate.photos && candidate.photos.length > 0
      ? candidate.photos
      : [
          {
            id: 'default',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
            sortOrder: 0,
          },
        ];

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 80;
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
      className="absolute inset-0 w-full h-full rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing select-none bg-[#151923] border border-white/10"
    >
      {/* 1. Asosiy Fotosurat */}
      <img
        src={photos[photoIndex]?.url}
        alt={candidate.firstName}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Rasm almashtirish sensor zonalari */}
      <div className="absolute inset-0 flex z-10">
        <div className="w-1/2 h-3/4" onClick={prevPhoto} />
        <div className="w-1/2 h-3/4" onClick={nextPhoto} />
      </div>

      {/* Top Stories Pagination Dots & Badge */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Pagination bars */}
        {photos.length > 1 && (
          <div className="flex items-center gap-1.5 w-full">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === photoIndex ? 'bg-white shadow' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/15">
            <span>📷</span>
            <span>
              {photoIndex + 1}/{photos.length}
            </span>
          </div>

          {candidate.isBoosted && (
            <div className="px-2.5 py-1 rounded-full bg-[#D9A441] text-[#0B0D12] text-[10px] font-black tracking-wide uppercase shadow">
              ⚡ BOOST
            </div>
          )}
        </div>
      </div>

      {/* Swipe Overlay Badges */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-14 left-6 z-20 border-2 border-[#FF4F79] bg-[#FF4F79]/30 px-5 py-1.5 rounded-2xl rotate-[-12deg] backdrop-blur-md shadow-lg"
      >
        <span className="text-2xl font-black text-white tracking-wider">LIKE ❤️</span>
      </motion.div>

      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-14 right-6 z-20 border-2 border-stone-400 bg-stone-900/60 px-5 py-1.5 rounded-2xl rotate-[12deg] backdrop-blur-md shadow-lg"
      >
        <span className="text-2xl font-black text-stone-300 tracking-wider">PASS ✕</span>
      </motion.div>

      <motion.div
        style={{ opacity: superLikeOpacity }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 border-2 border-[#D9A441] bg-[#D9A441]/30 px-6 py-2 rounded-2xl backdrop-blur-md shadow-xl"
      >
        <span className="text-xl font-black text-white tracking-wider">SUPER LIKE ⭐</span>
      </motion.div>

      {/* Bottom Gradient Overlay on photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-[#0B0D12]/40 to-transparent pointer-events-none" />

      {/* Profil Ma'lumotlari */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-5 z-20 pointer-events-none text-white">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow">
              {candidate.firstName}, {candidate.age}
            </h2>
            {candidate.isVerified && (
              <span className="text-sky-400 text-sm font-bold bg-sky-400/20 px-1.5 py-0.5 rounded-full border border-sky-400/40">
                ✓
              </span>
            )}
            {candidate.isPremium && (
              <span className="p-1 rounded-full bg-[#D9A441] text-[#0B0D12] shadow-sm">
                <Sparkles size={12} />
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.selection();
              onOpenDetails();
            }}
            className="pointer-events-auto p-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-all active:scale-90"
          >
            <Info size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-stone-300 text-xs mb-2 font-medium">
          <MapPin size={13} className="text-[#FF4F79]" />
          <span>{candidate.city}</span>
        </div>

        {candidate.bio && (
          <p className="text-stone-200 text-xs line-clamp-2 leading-relaxed mb-3 font-normal">
            “{candidate.bio}”
          </p>
        )}

        {/* Interest Chips */}
        {candidate.interests && candidate.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pointer-events-auto">
            {candidate.interests.slice(0, 3).map((it) => (
              <span
                key={it.id}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white shadow-sm"
              >
                {it.name}
              </span>
            ))}
            {candidate.interests.length > 3 && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold text-white/80">
                +{candidate.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};


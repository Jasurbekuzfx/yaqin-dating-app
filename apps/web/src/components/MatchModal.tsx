import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { MessageCircle, X, Heart } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram.js';

interface MatchModalProps {
  matchId: string;
  partnerName: string;
  partnerPhotoUrl?: string | null;
  myPhotoUrl?: string | null;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  matchId,
  partnerName,
  partnerPhotoUrl,
  myPhotoUrl,
  onClose,
}) => {
  const navigate = useNavigate();
  const { haptic } = useTelegram();

  useEffect(() => {
    haptic.notification('success');

    // Chiroyli nozik konfetti animatsiyasi
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FF4B6E', '#FFB8C6', '#E5A93C', '#FFFFFF'],
    });
  }, []);

  const handleStartChat = () => {
    haptic.impact('heavy');
    onClose();
    navigate(`/messages/${matchId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E0D1B]/95 backdrop-blur-md animate-fade-in font-sans overflow-hidden">
      {/* Floating subtle hearts in background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <Heart className="absolute top-12 left-10 w-8 h-8 text-[#FF4B6E] fill-[#FF4B6E] animate-pulse" />
        <Heart className="absolute top-24 right-14 w-6 h-6 text-[#FF4B6E] fill-[#FF4B6E] animate-bounce" />
        <Heart className="absolute bottom-28 left-8 w-7 h-7 text-[#FF4B6E] fill-[#FF4B6E]" />
        <Heart className="absolute bottom-40 right-10 w-5 h-5 text-[#FF4B6E] fill-[#FF4B6E]" />
      </div>

      <div className="w-full max-w-sm rounded-[32px] p-7 text-center relative flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-4 right-2 w-9 h-9 flex items-center justify-center text-white/70 hover:text-white rounded-full bg-white/10 backdrop-blur-sm transition-colors"
        >
          <X size={18} />
        </button>

        {/* Two Circular Profile Photos facing each other */}
        <div className="flex items-center justify-center -space-x-3 mb-8 relative mt-4">
          <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl relative z-10 bg-[#2D122D]">
            <img
              src={myPhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt="Siz"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Glowing heart badge in between */}
          <div className="w-10 h-10 rounded-full bg-[#FF4B6E] border-2 border-white flex items-center justify-center shadow-lg shadow-rose-500/50 z-30 transform scale-110">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>

          <div className="w-24 h-24 rounded-full border-4 border-[#FF4B6E] overflow-hidden shadow-2xl relative z-20 bg-[#2D122D]">
            <img
              src={partnerPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={partnerName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          Bu Match!
        </h2>
        <p className="text-stone-300 text-xs font-medium leading-relaxed max-w-xs mb-8">
          Bir-biringizga yoqdingiz.<br />
          Endi suhbatni boshlashingiz mumkin!
        </p>

        {/* Actions */}
        <div className="space-y-3 w-full">
          <button
            onClick={handleStartChat}
            className="w-full py-4 px-5 rounded-2xl bg-[#FF4B6E] hover:bg-[#E03A5B] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-500/30 active:scale-98 transition-all"
          >
            <MessageCircle size={18} />
            <span>Chatni boshlash</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 font-semibold text-xs active:scale-98 transition-all"
          >
            Keyinroq
          </button>
        </div>

        {/* Romantic Bottom Script */}
        <div className="mt-8 opacity-75 font-serif italic text-rose-200/80 text-xs tracking-wide text-center">
          Yangi tanishuvlar<br />
          yangi imkoniyatlar 💕
        </div>
      </div>
    </div>
  );
};


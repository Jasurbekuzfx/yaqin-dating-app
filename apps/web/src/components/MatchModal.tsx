import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { MessageCircle, X } from 'lucide-react';
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

    // Chiroyli konfetti animatsiyasi
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E5A93C', '#E11D48', '#38BDF8', '#F43F5E'],
    });
  }, []);

  const handleStartChat = () => {
    haptic.impact('heavy');
    onClose();
    navigate(`/messages/${matchId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl p-6 text-center relative border border-white/10 glass-panel">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-yaqin-muted hover:text-white rounded-full bg-white/5"
        >
          <X size={20} />
        </button>

        <span className="text-4xl block mb-2">💫</span>
        <h2 className="text-3xl font-black tracking-tight text-white mb-1">
          Bu Match!
        </h2>
        <p className="text-yaqin-muted text-sm mb-6">
          Siz va <span className="text-white font-semibold">{partnerName}</span> bir-biringizga yoqdingiz.
        </p>

        {/* Ikkita profil rasmining tutashuvi */}
        <div className="flex items-center justify-center -space-x-5 mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-yaqin-surface overflow-hidden shadow-2xl relative z-10">
            <img
              src={myPhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt="Siz"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-24 h-24 rounded-full border-4 border-yaqin-accent overflow-hidden shadow-2xl relative z-20">
            <img
              src={partnerPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={partnerName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Tugmalar */}
        <div className="space-y-3">
          <button
            onClick={handleStartChat}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all"
          >
            <MessageCircle size={20} />
            <span>Chatni boshlash</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium active:scale-98 transition-all"
          >
            Keyinroq
          </button>
        </div>
      </div>
    </div>
  );
};

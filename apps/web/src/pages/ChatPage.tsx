import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Send, MoreVertical, ShieldAlert, Ban, Check, CheckCheck, Paperclip, Smile, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface Message {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { haptic } = useTelegram();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Match ma'lumotlari va xabarlar tarixini olish
  useEffect(() => {
    if (!matchId || !token) return;

    const fetchMatchAndMessages = async () => {
      try {
        const [matchRes, msgsRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/matches/${matchId}/messages?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setPartner(matchData.match.partner);
        }

        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          setMessages(msgsData.messages || []);
          setTimeout(scrollToBottom, 100);
        }
      } catch (e) {
        console.error('Chat yuklashda xatolik:', e);
      }
    };

    fetchMatchAndMessages();
  }, [matchId, token]);

  // 2. Real-time Socket.IO ulanishi
  useEffect(() => {
    if (!matchId || !token) return;

    const socket = io('/', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.emit('join_match', matchId);

    socket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      haptic.notification('success');
      setTimeout(scrollToBottom, 50);
    });

    socket.on('user_typing', (data: { matchId: string; userId: string }) => {
      if (data.matchId === matchId && data.userId !== user?.id) {
        setIsTyping(true);
      }
    });

    socket.on('user_stopped_typing', (data: { matchId: string; userId: string }) => {
      if (data.matchId === matchId && data.userId !== user?.id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.emit('leave_match', matchId);
      socket.disconnect();
    };
  }, [matchId, token, user?.id]);

  // 3. Xabar yuborish
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !matchId || !token) return;

    const content = inputText.trim();
    setInputText('');
    haptic.impact('light');

    if (socketRef.current) {
      socketRef.current.emit('typing_stop', matchId);
    }

    try {
      const res = await fetch(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, type: 'TEXT' }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      console.error('Xabar yuborishda xatolik:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (socketRef.current && matchId) {
      socketRef.current.emit('typing_start', matchId);
    }
  };

  // Foydalanuvchini bloklash
  const handleBlock = async () => {
    if (!partner) return;
    if (confirm(`${partner.firstName} ni bloklamoqchimisiz?`)) {
      await fetch(`/api/users/${partner.id}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Foydalanuvchi bloklandi');
      navigate('/matches');
    }
  };

  // Shikoyat qilish
  const handleReport = async () => {
    if (!partner) return;
    const reason = prompt('Shikoyat sababini yozing:');
    if (reason) {
      await fetch(`/api/users/${partner.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'OTHER', description: reason }),
      });
      alert('Shikoyatingiz yuborildi');
      navigate('/matches');
    }
  };

  return (
    <div className="h-screen bg-[#0B0D12] text-white flex flex-col max-w-md mx-auto relative overflow-hidden font-sans">
      {/* Sarlavha (Header) */}
      <header className="px-4 py-3 bg-[#151923] border-b border-white/10 flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              haptic.selection();
              navigate('/matches');
            }}
            className="p-1 text-[#9AA4B8] hover:text-white rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>

          {partner && (
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-[#0B0D12]">
                <img
                  src={
                    partner.photos?.[0]?.url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={partner.firstName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight">
                  {partner.firstName}
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {isTyping ? 'yozmoqda...' : 'Online'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => alert('Qoʻngʻiroq funksiyasi tez orada!')}
            className="p-2 text-[#9AA4B8] hover:text-white rounded-full"
          >
            <Phone size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-[#9AA4B8] hover:text-white rounded-full"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-44 rounded-2xl bg-[#151923] border border-white/10 shadow-2xl p-1 z-30 animate-fade-in">
                <button
                  onClick={handleBlock}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
                >
                  <Ban size={14} />
                  <span>Bloklash</span>
                </button>
                <button
                  onClick={handleReport}
                  className="w-full px-3 py-2 text-xs font-bold text-stone-300 hover:bg-white/5 rounded-xl flex items-center gap-2"
                >
                  <ShieldAlert size={14} />
                  <span>Shikoyat qilish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Xabarlar ro'yxati */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
        {/* Bugun Pill */}
        <div className="text-center my-2">
          <span className="px-3 py-1 rounded-full bg-[#151923] border border-white/10 text-[10px] font-bold text-[#9AA4B8] shadow-sm">
            Bugun
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <span className="text-4xl mb-2">👋</span>
            <p className="text-[#9AA4B8] text-xs font-medium">
              Bu yangi suhbatning boshlanishi. Salom deb birinchi xabarni yuboring!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-md break-words ${
                    isMe
                      ? 'bg-[#FF4F79] text-white rounded-tr-none'
                      : 'bg-[#151923] text-stone-100 rounded-tl-none border border-white/10'
                  }`}
                >
                  <p className="font-medium">{m.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-white/70' : 'text-[#9AA4B8]'
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && (
                      <span>
                        {m.isRead ? (
                          <CheckCheck size={13} className="text-white" />
                        ) : (
                          <Check size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Xabar yozish maydoni */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#151923] border-t border-white/10 flex items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-lg"
      >
        <button
          type="button"
          onClick={() => alert('Rasm yuborish tez orada!')}
          className="p-2 text-[#9AA4B8] hover:text-white"
        >
          <Paperclip size={20} />
        </button>

        <div className="flex-1 flex items-center bg-[#0B0D12] rounded-2xl border border-white/10 px-3">
          <input
            type="text"
            placeholder="Xabar yozing..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 py-2.5 bg-transparent text-white text-xs placeholder-[#9AA4B8] focus:outline-none"
          />
          <button
            type="button"
            className="p-1 text-[#9AA4B8] hover:text-white"
          >
            <Smile size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-[#FF4F79] text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

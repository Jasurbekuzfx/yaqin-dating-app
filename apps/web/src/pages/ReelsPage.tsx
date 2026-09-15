import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Star,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Plus,
  Send,
  X,
  MoreVertical,
  ShieldAlert,
  EyeOff,
} from 'lucide-react';
import { Navigation } from '../components/Navigation.js';
import { useAuth } from '../context/AuthContext.js';
import { useTelegram } from '../hooks/useTelegram.js';

interface VideoItem {
  id: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  caption?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  user: {
    id: string;
    firstName: string;
    age: number;
    city: string;
    avatarUrl: string;
    isVerified: boolean;
    interests: string[];
  };
}

export const ReelsPage: React.FC = () => {
  const { token } = useAuth();
  const { haptic } = useTelegram();
  const queryClient = useQueryClient();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Kommentlar bottom sheet holati
  const [activeCommentsVideoId, setActiveCommentsVideoId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Video yuklash modali holati
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // More menyusi holati
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  // 1. Videolar lentasini olish
  const { data, isLoading } = useQuery<{ success: boolean; videos: VideoItem[] }>({
    queryKey: ['reels-feed'],
    queryFn: async () => {
      const res = await fetch('/api/videos/feed?limit=15', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Videolarni yuklab boʻlmadi');
      return res.json();
    },
    enabled: !!token,
  });

  const videos = data?.videos || [];
  const currentVideo = videos[activeIndex];

  // 2. Like mutatsiyasi
  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels-feed'] });
    },
  });

  // 3. Super Like mutatsiyasi
  const superLikeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await fetch(`/api/videos/${videoId}/super-like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        haptic.notification('success');
        alert('⭐ Videoga Super Like yuborildi!');
      } else {
        alert(data.error || 'Super like yuborilmadi');
      }
    },
  });

  // 4. Kommentlar ro'yxati
  const { data: commentsData } = useQuery({
    queryKey: ['video-comments', activeCommentsVideoId],
    queryFn: async () => {
      if (!activeCommentsVideoId) return { comments: [] };
      const res = await fetch(`/api/videos/${activeCommentsVideoId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: !!activeCommentsVideoId,
  });

  // 5. Komment qo'shish mutatsiyasi
  const addCommentMutation = useMutation({
    mutationFn: async ({ videoId, content }: { videoId: string; content: string }) => {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['video-comments', activeCommentsVideoId] });
      queryClient.invalidateQueries({ queryKey: ['reels-feed'] });
    },
  });

  // 6. View hisoblash (Anti-spam 2s threshold)
  useEffect(() => {
    if (!currentVideo) return;
    const timer = setTimeout(() => {
      fetch(`/api/videos/${currentVideo.id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ durationSeconds: 2 }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeIndex, currentVideo, token]);

  // Video almashganda autoplay / pause boshqaruvi
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const idx = Number(key);
      const vid = videoRefs.current[idx];
      if (vid) {
        if (idx === activeIndex) {
          vid.currentTime = 0;
          vid.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vid.pause();
        }
      }
    });
  }, [activeIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;
    const newIdx = Math.round(scrollTop / clientHeight);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < videos.length) {
      setActiveIndex(newIdx);
      haptic.selection();
    }
  };

  const togglePlay = () => {
    const currentEl = videoRefs.current[activeIndex];
    if (currentEl) {
      if (isPlaying) {
        currentEl.pause();
        setIsPlaying(false);
      } else {
        currentEl.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact('light');
    setIsMuted(!isMuted);
  };

  const handleDoubleTap = (videoId: string) => {
    haptic.impact('heavy');
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    likeMutation.mutate(videoId);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentsVideoId || !commentText.trim()) return;
    haptic.impact('medium');
    addCommentMutation.mutate({ videoId: activeCommentsVideoId, content: commentText.trim() });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    haptic.impact('heavy');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('video', uploadFile);
    formData.append('caption', uploadCaption);

    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadCaption('');
        alert('🎉 Videongiz muvaffaqiyatli yuklandi!');
        queryClient.invalidateQueries({ queryKey: ['reels-feed'] });
      } else {
        alert(data.error || 'Video yuklashda xatolik');
      }
    } catch {
      alert('Tarmoq xatoligi');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#0B0D12] text-white flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans select-none">
      {/* Top Bar Header */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-3 pb-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white drop-shadow">Yaqin</span>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-white border-b-2 border-[#FF4F79] pb-0.5">Sen uchun</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute/Unmute */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Video yuklash tugmasi */}
          <button
            onClick={() => {
              haptic.selection();
              setShowUploadModal(true);
            }}
            className="px-3 py-1.5 rounded-full bg-[#FF4F79] text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-500/40"
          >
            <Plus size={15} />
            <span>Qoʻshish</span>
          </button>
        </div>
      </div>

      {/* 9:16 Vertical Video Feed with Snap Scroll */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-3 border-[#FF4F79] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B0D12] text-white">
          <div className="w-16 h-16 rounded-full bg-[#151923] border border-white/10 flex items-center justify-center text-3xl mb-4">
            🎬
          </div>
          <h3 className="text-lg font-bold mb-1">Videolar hali kam</h3>
          <p className="text-[#9AA4B8] text-xs mb-5">Birinchi videoni siz joylang!</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#FF4F79] text-white font-bold text-xs shadow-lg shadow-rose-500/30"
          >
            Video qoʻshish
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-none relative pb-16"
        >
          {videos.map((vid, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={vid.id}
                className="w-full h-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
                onClick={togglePlay}
                onDoubleClick={() => handleDoubleTap(vid.id)}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  src={vid.url}
                  poster={vid.thumbnailUrl}
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Pause icon overlay */}
                {!isPlaying && isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <Play size={32} className="fill-white translate-x-0.5" />
                    </div>
                  </div>
                )}

                {/* Double Tap Heart Burst Animation */}
                {showHeartBurst && isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                    <Heart size={90} className="fill-[#FF4F79] text-[#FF4F79] drop-shadow-2xl" />
                  </div>
                )}

                {/* Gradient pastki qoplama */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-transparent pointer-events-none" />

                {/* Pastki profil ma'lumotlari */}
                <div className="absolute bottom-6 left-4 right-18 z-20 pointer-events-none text-white">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 shadow">
                      <img
                        src={vid.user.avatarUrl}
                        alt={vid.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold flex items-center gap-1 leading-tight">
                        {vid.user.firstName}, {vid.user.age}
                        {vid.user.isVerified && <span className="text-sky-400 text-xs">✓</span>}
                      </h4>
                      <span className="text-[11px] text-stone-300">📍 {vid.user.city}</span>
                    </div>
                  </div>

                  {vid.caption && (
                    <p className="text-xs text-stone-100 line-clamp-2 leading-relaxed mb-2 font-medium drop-shadow">
                      {vid.caption}
                    </p>
                  )}

                  {vid.user.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {vid.user.interests.slice(0, 3).map((it, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* O'ng tomon vertikal action tugmalari */}
                <div className="absolute bottom-6 right-3 z-20 flex flex-col items-center gap-4.5 pointer-events-auto">
                  {/* Like */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.impact('heavy');
                      likeMutation.mutate(vid.id);
                    }}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                      <Heart
                        size={24}
                        className={vid.isLiked ? 'fill-[#FF4F79] text-[#FF4F79]' : 'text-white'}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white shadow-sm">{vid.likeCount}</span>
                  </button>

                  {/* Comment */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.selection();
                      setActiveCommentsVideoId(vid.id);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                      <MessageCircle size={22} />
                    </div>
                    <span className="text-[10px] font-bold text-white shadow-sm">
                      {vid.commentCount}
                    </span>
                  </button>

                  {/* Super Like */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.impact('heavy');
                      superLikeMutation.mutate(vid.id);
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441] active:scale-90 transition-all">
                      <Star size={22} className="fill-[#D9A441]" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300">Super</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptic.selection();
                      if (navigator.share) {
                        navigator.share({
                          title: `${vid.user.firstName} — Yaqin`,
                          url: window.location.href,
                        });
                      } else {
                        alert('Havola nusxalandi');
                      }
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                      <Share2 size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-white">Ulashish</span>
                  </button>

                  {/* More */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(true);
                    }}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kommentlar Bottom Sheet */}
      {activeCommentsVideoId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#151923] text-white rounded-t-[28px] p-4 max-h-[70vh] flex flex-col border-t border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                Kommentlar ({commentsData?.comments?.length || 0})
              </h3>
              <button
                onClick={() => setActiveCommentsVideoId(null)}
                className="p-1.5 rounded-full bg-white/10 text-[#9AA4B8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Kommentlar ro'yxati */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-[200px]">
              {commentsData?.comments?.length === 0 ? (
                <div className="text-center py-8 text-[#9AA4B8] text-xs">
                  Hozircha izohlar yoʻq. Birinchi boʻlib fikr bildiring!
                </div>
              ) : (
                commentsData?.comments?.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={c.user.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <span className="font-bold text-white mr-1.5">{c.user.firstName}</span>
                      <span className="text-stone-300">{c.content}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Komment yozish formasi */}
            <form
              onSubmit={handleAddComment}
              className="pt-2 flex items-center gap-2 border-t border-white/10"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Izoh qoldiring..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#0B0D12] border border-white/10 text-white placeholder-[#9AA4B8] text-xs focus:outline-none focus:border-[#FF4F79]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 rounded-2xl bg-[#FF4F79] text-white disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Video Yuklash Modali */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#151923] text-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black">Video joylash (Reels)</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-full bg-white/10 text-[#9AA4B8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <label className="block p-5 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#FF4F79] text-center cursor-pointer bg-[#0B0D12] transition-all">
                <div className="text-2xl mb-1">📹</div>
                <span className="text-xs font-bold text-white block">
                  {uploadFile ? uploadFile.name : 'Videoni tanlang (Max 30s)'}
                </span>
                <span className="text-[10px] text-[#9AA4B8]">MP4, MOV, WebM formatlari</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <div>
                <label className="text-xs font-bold text-white block mb-1">Izoh (Caption):</label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Videongizga qisqa izoh yozing..."
                  className="w-full p-3 rounded-2xl bg-[#0B0D12] border border-white/10 text-white placeholder-[#9AA4B8] text-xs focus:outline-none focus:border-[#FF4F79] resize-none h-20"
                />
              </div>

              <button
                type="submit"
                disabled={!uploadFile || isUploading}
                className="w-full py-3.5 rounded-2xl bg-[#FF4F79] text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 disabled:opacity-50 active:scale-98 transition-all"
              >
                {isUploading ? 'Yuklanmoqda...' : 'Videoni eʼlon qilish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* More Menu Modali */}
      {showMoreMenu && currentVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-4">
          <div className="bg-[#151923] text-white rounded-[28px] p-4 space-y-2 max-w-sm mx-auto w-full border border-white/10">
            <button
              onClick={() => {
                setShowMoreMenu(false);
                alert('Ushbu video feeddan olib tashlandi');
              }}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl hover:bg-white/5 flex items-center gap-2 text-stone-300"
            >
              <EyeOff size={16} />
              <span>Qiziq emas</span>
            </button>
            <button
              onClick={() => {
                setShowMoreMenu(false);
                alert('Shikoyat yuborildi');
              }}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
            >
              <ShieldAlert size={16} />
              <span>Shikoyat qilish</span>
            </button>
            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full py-2.5 text-xs font-bold text-center bg-white/10 rounded-xl mt-2 text-white"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* Pastki navigatsiya */}
      <Navigation />
    </div>
  );
};

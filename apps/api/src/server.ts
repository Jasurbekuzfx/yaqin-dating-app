import http from 'http';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

import { requireAuth } from './middlewares/auth.js';
import { requireAdmin } from './middlewares/rbac.js';
import { initChatSocket } from './socket/chatSocket.js';

// Controllerlar
import { AuthController } from './controllers/authController.js';
import { ProfileController } from './controllers/profileController.js';
import { DiscoverController } from './controllers/discoverController.js';
import { LikeController } from './controllers/likeController.js';
import { MatchController } from './controllers/matchController.js';
import { ChatController } from './controllers/chatController.js';
import { PremiumController } from './controllers/premiumController.js';
import { SafetyController } from './controllers/safetyController.js';
import { AdminController } from './controllers/adminController.js';
import { VideoController } from './controllers/videoController.js';

const app = express();
const server = http.createServer(app);

// Socket.IO ni ishga tushirish
initChatSocket(server);

// Xavfsizlik sarlavhalari (Security Headers)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
app.use(cors({ origin: true, credentials: true }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter: umumiy so'rovlar uchun daqiqasiga 120 ta so'rov
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Juda koʻp soʻrov yuborildi. Iltimos, biroz kuting.' },
});
app.use('/api/', generalLimiter);

// Multer xotirada saqlash konfiguratsiyasi
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm formatidagi fayllar qabul qilinadi'));
    }
  },
});

// Statik fayllar (Yuklangan rasmlar)
const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Root Health Check for UptimeRobot & Load Balancers
app.get(['/', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Yaqin Dating API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API YO'NALISHLARI (ROUTES)
// ==========================================

const api = express.Router();

// 1. Health check
api.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Auth Routes
api.post('/auth/telegram', AuthController.telegramAuth);
api.post('/auth/admin/login', AuthController.adminLogin);

// 3. Profile Routes
api.get('/profile/me', requireAuth, ProfileController.getMe);
api.put('/profile/me', requireAuth, ProfileController.updateMe);
api.post('/profile/photos', requireAuth, upload.single('photo'), ProfileController.uploadPhoto);
api.delete('/profile/photos/:id', requireAuth, ProfileController.deletePhoto);
api.get('/profile/config', ProfileController.getConfig);

// 4. Discover Routes
api.get('/discover', requireAuth, DiscoverController.getRecommendations);
api.post('/discover/:userId/like', requireAuth, LikeController.sendLike);
api.post('/discover/:userId/skip', requireAuth, DiscoverController.skipCandidate);
api.post('/discover/:userId/super-like', requireAuth, LikeController.sendLike);

// 5. Likes Routes
api.get('/likes/received', requireAuth, LikeController.getReceivedLikes);

// 6. Matches Routes
api.get('/matches', requireAuth, MatchController.getMatches);
api.get('/matches/:id', requireAuth, MatchController.getMatchById);

// 7. Chat Routes
api.get('/matches/:id/messages', requireAuth, ChatController.getMessages);
api.post('/matches/:id/messages', requireAuth, ChatController.sendMessage);
api.post('/matches/:id/read', requireAuth, ChatController.markAsRead);

// 8. Premium & Payments Routes
api.get('/premium/plans', PremiumController.getPlans);
api.post('/payments/create', requireAuth, PremiumController.createPayment);
api.post('/payments/verify', PremiumController.verifyPayment);

// 9. Safety Routes
api.post('/users/:id/block', requireAuth, SafetyController.blockUser);
api.delete('/users/:id/block', requireAuth, SafetyController.unblockUser);
api.get('/users/blocked', requireAuth, SafetyController.getBlockedUsers);
api.post('/users/:id/report', requireAuth, SafetyController.reportUser);
api.post('/verification/request', requireAuth, upload.single('selfie'), SafetyController.submitVerification);

// 10. Video Tanishuv (Reels) Routes
api.get('/videos/feed', VideoController.getFeed);
api.post('/videos', requireAuth, upload.single('video'), VideoController.uploadVideo);
api.post('/videos/:id/like', requireAuth, VideoController.toggleLike);
api.post('/videos/:id/super-like', requireAuth, VideoController.superLike);
api.post('/videos/:id/view', VideoController.recordView);
api.get('/videos/:id/comments', VideoController.getComments);
api.post('/videos/:id/comments', requireAuth, VideoController.addComment);
api.get('/users/:userId/videos', VideoController.getUserVideos);
api.delete('/videos/:id', requireAuth, VideoController.deleteVideo);

// 11. Admin Routes (RBAC bilan himoyalangan)
api.get('/admin/stats', requireAdmin('ADMIN'), AdminController.getDashboardStats);
api.get('/admin/users', requireAdmin('ADMIN'), AdminController.getUsers);
api.post('/admin/users/:id/ban', requireAdmin('ADMIN'), AdminController.toggleBanUser);
api.post('/admin/users/:id/verify', requireAdmin('ADMIN'), AdminController.toggleVerifyUser);
api.get('/admin/reports', requireAdmin('ADMIN'), AdminController.getReports);
api.post('/admin/reports/:id/status', requireAdmin('ADMIN'), AdminController.updateReportStatus);
api.get('/admin/verifications', requireAdmin('ADMIN'), AdminController.getVerifications);
api.post('/admin/verifications/:id/review', requireAdmin('ADMIN'), AdminController.reviewVerification);
api.get('/admin/payments', requireAdmin('ADMIN'), AdminController.getPayments);

app.use('/api', api);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint topilmadi' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Ichki server xatoligi',
  });
});

// Serverni tinglash
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Yaqin API Server ${HOST}:${PORT} da ishga tushdi!`);
});

export { app, server };

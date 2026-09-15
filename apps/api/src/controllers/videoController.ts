import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { TelegramBotService } from '../services/telegramBotService.js';
import { StorageService } from '../services/storageService.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class VideoController {
  /**
   * Video Feed (Recommendation-based for 9:16 vertical reels)
   */
  static async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = req.query.cursor as string | undefined;

      // Agar user bo'lsa bloklanganlarni inobatga olish
      let blockedUserIds: string[] = [];
      if (userId) {
        const blocks = await prisma.block.findMany({
          where: {
            OR: [{ blockerId: userId }, { blockedId: userId }],
          },
        });
        blockedUserIds = blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
        blockedUserIds.push(userId); // o'zining videosi feedga chiqmasligi uchun
      }

      const videos = await prisma.video.findMany({
        where: {
          status: 'PUBLISHED',
          isPublic: true,
          userId: { notIn: blockedUserIds },
          user: { isBanned: false, isBlocked: false },
        },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            include: {
              city: true,
              photos: { where: { isPrimary: true }, take: 1 },
              userInterests: { include: { interest: true } },
            },
          },
          likes: userId ? { where: { userId } } : false,
        },
      });

      const formatted = videos.map((v) => ({
        id: v.id,
        url: v.url,
        thumbnailUrl: v.thumbnailUrl || v.user.photos[0]?.url || '',
        caption: v.caption,
        duration: v.duration,
        width: v.width,
        height: v.height,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
        viewCount: v.viewCount,
        isLiked: userId ? (v.likes as any)?.length > 0 : false,
        createdAt: v.createdAt,
        user: {
          id: v.user.id,
          firstName: v.user.firstName,
          age: new Date().getFullYear() - new Date(v.user.birthDate).getFullYear(),
          city: v.user.city?.name || 'Oʻzbekiston',
          avatarUrl: v.user.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          isVerified: v.user.isVerified,
          isPremium: v.user.isPremium,
          bio: v.user.bio,
          interests: v.user.userInterests.map((ui) => ui.interest.name),
        },
      }));

      const nextCursor = videos.length === limit ? videos[videos.length - 1].id : null;

      res.json({
        success: true,
        videos: formatted,
        nextCursor,
      });
    } catch (err: any) {
      console.error('getFeed xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Video yuklash (Upload video max 30s)
   */
  static async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;
      const { caption = '', isPublic = 'true' } = req.body;

      if (!file) {
        res.status(400).json({ success: false, error: 'Video fayl tanlanmadi' });
        return;
      }

      // Foydalanuvchining video limitini tekshirish (Free: 3 ta, Premium: 10 ta)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true },
      });

      const maxAllowed = user?.isPremium ? 10 : 3;
      const existingVideosCount = await prisma.video.count({
        where: { userId, status: { not: 'DELETED' } },
      });

      if (existingVideosCount >= maxAllowed) {
        res.status(400).json({
          success: false,
          error: `Maksimal video limiti (${maxAllowed} ta) tugagan. Koʻproq joylash uchun Premium xarid qiling.`,
        });
        return;
      }

      // Faylni saqlash
      const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExt = path.extname(file.originalname).toLowerCase() || '.mp4';
      const fileName = `vid_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, file.buffer);
      const videoUrl = `/uploads/${fileName}`;

      const video = await prisma.video.create({
        data: {
          userId,
          url: videoUrl,
          caption: caption.trim(),
          isPublic: isPublic === 'true' || isPublic === true,
          status: 'PUBLISHED',
          duration: 15.0,
        },
      });

      res.json({
        success: true,
        video,
      });
    } catch (err: any) {
      console.error('uploadVideo xatolik:', err);
      res.status(500).json({ success: false, error: 'Video yuklashda xatolik yuz berdi' });
    }
  }

  /**
   * Video Like bosish / Olib tashlash
   */
  static async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const videoId = String(req.params.id);

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { user: { select: { id: true, telegramId: true, firstName: true } } },
      });

      if (!video) {
        res.status(404).json({ success: false, error: 'Video topilmadi' });
        return;
      }

      const existingLike = await prisma.videoLike.findUnique({
        where: {
          videoId_userId: { videoId, userId },
        },
      });

      if (existingLike) {
        // Un-like
        await prisma.$transaction([
          prisma.videoLike.delete({
            where: { id: existingLike.id },
          }),
          prisma.video.update({
            where: { id: videoId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);

        res.json({ success: true, isLiked: false, likeCount: Math.max(0, video.likeCount - 1) });
        return;
      }

      // Like qo'shish
      await prisma.$transaction([
        prisma.videoLike.create({
          data: { videoId, userId },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likeCount: { increment: 1 } },
        }),
        // Shuningdek profil Like munosabatiga ham qo'shish
        prisma.like.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: userId,
              toUserId: video.userId,
            },
          },
          create: {
            fromUserId: userId,
            toUserId: video.userId,
            type: 'LIKE',
          },
          update: { type: 'LIKE' },
        }),
      ]);

      // Reciprocal match tekshirish: video egasi ham bu userga like bosganmi?
      const reverseLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: video.userId,
            toUserId: userId,
          },
        },
      });

      let isMatch = false;
      if (reverseLike && reverseLike.type !== 'SKIP') {
        const [userAId, userBId] = userId < video.userId ? [userId, video.userId] : [video.userId, userId];
        await prisma.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId },
          update: {},
        });
        isMatch = true;

        const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true } });
        if (currentUser) {
          TelegramBotService.sendMatchNotification(video.user.telegramId, currentUser.firstName);
        }
      } else {
        TelegramBotService.sendLikeNotification(video.user.telegramId);
      }

      res.json({
        success: true,
        isLiked: true,
        likeCount: video.likeCount + 1,
        isMatch,
      });
    } catch (err: any) {
      console.error('toggleLike xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Video Super Like bosish
   */
  static async superLike(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const videoId = String(req.params.id);

      const [user, video] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { superLikeBalance: true, firstName: true } }),
        prisma.video.findUnique({
          where: { id: videoId },
          include: { user: { select: { id: true, telegramId: true } } },
        }),
      ]);

      if (!video) {
        res.status(404).json({ success: false, error: 'Video topilmadi' });
        return;
      }

      if (!user || user.superLikeBalance < 1) {
        res.status(400).json({ success: false, error: 'Super Like balansingiz yetarli emas' });
        return;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { superLikeBalance: { decrement: 1 } },
        }),
        prisma.superLikeTransaction.create({
          data: { userId, count: 1, type: 'SPEND' },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { likeCount: { increment: 2 } },
        }),
        prisma.videoLike.upsert({
          where: { videoId_userId: { videoId, userId } },
          create: { videoId, userId },
          update: {},
        }),
      ]);

      TelegramBotService.sendSuperLikeNotification(video.user.telegramId);

      res.json({
        success: true,
        message: 'Super Like yuborildi!',
      });
    } catch (err: any) {
      console.error('superLike xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Video ko'rish (Anti-spam 2 soniyali ko'rish)
   */
  static async recordView(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const videoId = String(req.params.id);

      if (userId) {
        const existingView = await prisma.videoView.findUnique({
          where: { videoId_userId: { videoId, userId } },
        });

        if (!existingView) {
          await prisma.$transaction([
            prisma.videoView.create({ data: { videoId, userId } }),
            prisma.video.update({
              where: { id: videoId },
              data: { viewCount: { increment: 1 } },
            }),
          ]);
        }
      } else {
        await prisma.video.update({
          where: { id: videoId },
          data: { viewCount: { increment: 1 } },
        });
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Kommentlar ro'yxati
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const videoId = String(req.params.id);
      const comments = await prisma.videoComment.findMany({
        where: { videoId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      const formatted = comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          firstName: c.user.firstName,
          avatarUrl: c.user.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        },
      }));

      res.json({ success: true, comments: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Komment yozish
   */
  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const videoId = String(req.params.id);
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, error: 'Komment matni boʻsh boʻlishi mumkin emas' });
        return;
      }

      const [comment] = await prisma.$transaction([
        prisma.videoComment.create({
          data: {
            videoId,
            userId,
            content: content.trim(),
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                photos: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        }),
        prisma.video.update({
          where: { id: videoId },
          data: { commentCount: { increment: 1 } },
        }),
      ]);

      res.json({
        success: true,
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: {
            id: comment.user.id,
            firstName: comment.user.firstName,
            avatarUrl: comment.user.photos[0]?.url,
          },
        },
      });
    } catch (err: any) {
      console.error('addComment xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchining videolari
   */
  static async getUserVideos(req: Request, res: Response): Promise<void> {
    try {
      const targetUserId = String(req.params.userId);
      const videos = await prisma.video.findMany({
        where: {
          userId: targetUserId,
          status: 'PUBLISHED',
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, videos });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Videoni o'chirish (Soft delete)
   */
  static async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const videoId = String(req.params.id);

      const video = await prisma.video.findFirst({
        where: { id: videoId, userId },
      });

      if (!video) {
        res.status(404).json({ success: false, error: 'Video topilmadi yoki oʻchirish huquqi yoʻq' });
        return;
      }

      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'DELETED' },
      });

      res.json({ success: true, message: 'Video muvaffaqiyatli oʻchirildi' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

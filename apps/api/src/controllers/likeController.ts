import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { TelegramBotService } from '../services/telegramBotService.js';
import { getSocketIO } from '../socket/chatSocket.js';

export class LikeController {
  /**
   * Foydalanuvchiga Like yoki Super Like bosish
   */
  static async sendLike(req: Request, res: Response): Promise<void> {
    try {
      const fromUserId = req.user!.id;
      const toUserId = String(req.params.userId);
      const isSuperLike = req.body.type === 'SUPER_LIKE' || req.path.includes('super-like');

      if (fromUserId === toUserId) {
        res.status(400).json({ success: false, error: 'Oʻzingizga like bosa olmaysiz' });
        return;
      }

      // ToUserId mavjudligini va ban qilinmaganligini tekshirish
      const toUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, telegramId: true, firstName: true, isBanned: true },
      });

      if (!toUser || toUser.isBanned) {
        res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi yoki faol emas' });
        return;
      }

      // Super Like tekshiruvi va balansdan ayirish
      if (isSuperLike) {
        const fromUser = await prisma.user.findUnique({
          where: { id: fromUserId },
          select: { superLikeBalance: true },
        });

        if (!fromUser || fromUser.superLikeBalance < 1) {
          res.status(400).json({
            success: false,
            error: 'Super Like balansingiz yetarli emas. Xarid qiling.',
          });
          return;
        }

        // Atomik tarzda balansni kamaytirish va tranzaksiyani yozish
        await prisma.$transaction([
          prisma.user.update({
            where: { id: fromUserId },
            data: { superLikeBalance: { decrement: 1 } },
          }),
          prisma.superLikeTransaction.create({
            data: {
              userId: fromUserId,
              count: 1,
              type: 'SPEND',
            },
          }),
        ]);
      }

      const likeType = isSuperLike ? 'SUPER_LIKE' : 'LIKE';

      // 1. Like yozish yoki yangilash
      await prisma.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId,
            toUserId,
          },
        },
        create: {
          fromUserId,
          toUserId,
          type: likeType,
        },
        update: {
          type: likeType,
        },
      });

      // 2. Qarama-qarshi (reverse) Like mavjudligini tekshirish: B -> A
      const reverseLike = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        },
      });

      const isMutualMatch = !!reverseLike && reverseLike.type !== 'SKIP';

      let matchResult: any = null;

      if (isMutualMatch) {
        // MATCH HOSIL BO'LDI!
        const [userAId, userBId] =
          fromUserId < toUserId ? [fromUserId, toUserId] : [toUserId, fromUserId];

        const match = await prisma.match.upsert({
          where: {
            userAId_userBId: {
              userAId,
              userBId,
            },
          },
          create: {
            userAId,
            userBId,
          },
          update: {},
          include: {
            userA: {
              select: {
                id: true,
                firstName: true,
                photos: { where: { isPrimary: true }, take: 1 },
              },
            },
            userB: {
              select: {
                id: true,
                firstName: true,
                photos: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        });

        matchResult = {
          id: match.id,
          matchedAt: match.createdAt,
          partner: {
            id: toUser.id,
            firstName: toUser.firstName,
          },
        };

        // Realtime Socket.IO xabari yuborish
        const io = getSocketIO();
        if (io) {
          io.to(`user_${fromUserId}`).emit('match_created', matchResult);
          io.to(`user_${toUserId}`).emit('match_created', {
            id: match.id,
            matchedAt: match.createdAt,
            partner: {
              id: req.user!.id,
              firstName: req.user!.firstName,
            },
          });
        }

        // Telegram Bot orqali ikkala userga tabrik bildirishnomasi
        const currentUser = await prisma.user.findUnique({
          where: { id: fromUserId },
          select: { firstName: true, telegramId: true },
        });

        if (currentUser) {
          TelegramBotService.sendMatchNotification(toUser.telegramId, currentUser.firstName);
          TelegramBotService.sendMatchNotification(currentUser.telegramId, toUser.firstName);
        }
      } else {
        if (isSuperLike) {
          TelegramBotService.sendSuperLikeNotification(toUser.telegramId);
        } else {
          TelegramBotService.sendLikeNotification(toUser.telegramId);
        }
      }

      res.json({
        success: true,
        isMatch: isMutualMatch,
        match: matchResult,
      });
    } catch (err: any) {
      console.error('sendLike xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchiga kelgan Likelar roʻyxati
   */
  static async getReceivedLikes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const isPremium = req.user!.isPremium;

      const receivedLikes = await prisma.like.findMany({
        where: {
          toUserId: userId,
          type: { in: ['LIKE', 'SUPER_LIKE'] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            include: {
              city: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      const totalCount = receivedLikes.length;

      const formatted = receivedLikes.map((l: any) => {
        const u = l.fromUser;
        const photoUrl = u.photos[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

        if (isPremium) {
          return {
            id: l.id,
            fromUserId: u.id,
            type: l.type,
            createdAt: l.createdAt,
            user: {
              id: u.id,
              firstName: u.firstName,
              city: u.city?.name,
              photoUrl: photoUrl,
              blurredPhotoUrl: photoUrl,
              isVerified: u.isVerified,
              isPremium: u.isPremium,
            },
          };
        } else {
          return {
            id: l.id,
            fromUserId: u.id,
            type: l.type,
            createdAt: l.createdAt,
            user: {
              blurredPhotoUrl: photoUrl,
              isVerified: u.isVerified,
              isPremium: u.isPremium,
            },
          };
        }
      });

      res.json({
        success: true,
        totalCount,
        isPremium,
        likes: formatted,
      });
    } catch (err: any) {
      console.error('getReceivedLikes xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

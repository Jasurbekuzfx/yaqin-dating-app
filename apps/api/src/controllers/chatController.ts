import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { TelegramBotService } from '../services/telegramBotService.js';
import { getSocketIO } from '../socket/chatSocket.js';

export class ChatController {
  /**
   * Xabarlar tarixini olish (Cursor-based pagination)
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const matchId = String(req.params.id);
      const limit = parseInt(req.query.limit as string) || 30;
      const cursor = req.query.cursor as string | undefined;

      // 1. Foydalanuvchi ushbu match a'zosimi?
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match || (match.userAId !== userId && match.userBId !== userId)) {
        res.status(403).json({ success: false, error: 'Ushbu suhbatga kirish huquqingiz yoʻq' });
        return;
      }

      // 2. Cursor pagination orqali xabarlarni olish
      const messages = await prisma.message.findMany({
        where: { matchId },
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' }, // Eng yangilari oldinda
      });

      // Suhbatdosh yuborgan xabarlarni avtomatik o'qilgan deb belgilash
      await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

      res.json({
        success: true,
        messages: messages.reverse(),
      });
    } catch (err: any) {
      console.error('getMessages xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Xabar yuborish
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const senderId = req.user!.id;
      const matchId = String(req.params.id);
      const { content, type = 'TEXT' } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, error: 'Xabar matni boʻsh boʻlishi mumkin emas' });
        return;
      }

      // 1. Match mavjudligini va a'zolikni tekshirish
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          userA: { select: { id: true, telegramId: true, firstName: true } },
          userB: { select: { id: true, telegramId: true, firstName: true } },
        },
      });

      if (!match || (match.userAId !== senderId && match.userBId !== senderId)) {
        res.status(403).json({ success: false, error: 'Ushbu suhbatga kirish huquqingiz yoʻq' });
        return;
      }

      const recipient = match.userAId === senderId ? match.userB : match.userA;
      const sender = match.userAId === senderId ? match.userA : match.userB;

      // 2. Bloklanganlik tekshiruvi
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: recipient.id },
            { blockerId: recipient.id, blockedId: senderId },
          ],
        },
      });

      if (isBlocked) {
        res.status(403).json({
          success: false,
          error: 'Siz bu foydalanuvchiga xabar yubora olmaysiz (bloklangan)',
        });
        return;
      }

      // 3. Xabarni saqlash va Match lastMessageAt ni yangilash
      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            matchId,
            senderId,
            content: content.trim(),
            type,
          },
        }),
        prisma.match.update({
          where: { id: matchId },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      // 4. Real-time Socket.IO xabari
      const io = getSocketIO();
      if (io) {
        io.to(`match_${matchId}`).emit('new_message', message);
        io.to(`user_${recipient.id}`).emit('message_received', {
          matchId,
          message,
        });
      }

      // 5. Telegram Bot orqali bildirishnoma yuborish
      TelegramBotService.sendMessageNotification(
        recipient.telegramId,
        sender.firstName,
        content.trim()
      );

      res.json({
        success: true,
        message,
      });
    } catch (err: any) {
      console.error('sendMessage xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Xabarlarni o'qildi deb belgilash
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const matchId = String(req.params.id);

      await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      const io = getSocketIO();
      if (io) {
        io.to(`match_${matchId}`).emit('messages_read', { matchId, readBy: userId });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('markAsRead xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

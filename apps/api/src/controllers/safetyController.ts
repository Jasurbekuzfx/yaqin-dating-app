import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { StorageService } from '../services/storageService.js';

export class SafetyController {
  /**
   * Foydalanuvchini bloklash
   */
  static async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const blockerId = req.user!.id;
      const blockedId = String(req.params.id);

      if (blockerId === blockedId) {
        res.status(400).json({ success: false, error: 'Oʻzingizni bloklay olmaysiz' });
        return;
      }

      await prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
        create: {
          blockerId,
          blockedId,
        },
        update: {},
      });

      res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli bloklandi' });
    } catch (err: any) {
      console.error('blockUser xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Blokdan chiqarish
   */
  static async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const blockerId = req.user!.id;
      const blockedId = String(req.params.id);

      await prisma.block.deleteMany({
        where: { blockerId, blockedId },
      });

      res.json({ success: true, message: 'Foydalanuvchi blokdan chiqarildi' });
    } catch (err: any) {
      console.error('unblockUser xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Bloklanganlar ro'yxati
   */
  static async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const blockedList = await prisma.block.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      res.json({
        success: true,
        blockedUsers: blockedList.map((b) => ({
          id: b.blocked.id,
          firstName: b.blocked.firstName,
          lastName: b.blocked.lastName,
          photoUrl: b.blocked.photos[0]?.url || null,
          blockedAt: b.createdAt,
        })),
      });
    } catch (err: any) {
      console.error('getBlockedUsers xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchi ustidan shikoyat qilish (Report)
   */
  static async reportUser(req: Request, res: Response): Promise<void> {
    try {
      const reporterId = req.user!.id;
      const reportedId = String(req.params.id);
      const { reason, description } = req.body;

      if (!reason) {
        res.status(400).json({ success: false, error: 'Shikoyat sababini koʻrsating' });
        return;
      }

      await prisma.report.create({
        data: {
          reporterId,
          reportedId,
          reason,
          description: description ? description.trim() : null,
          status: 'PENDING',
        },
      });

      // Foydalanuvchini avtomatik ravishda bloklab qo'yish (qo'shimcha himoya uchun)
      await prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: reporterId,
            blockedId: reportedId,
          },
        },
        create: { blockerId: reporterId, blockedId: reportedId },
        update: {},
      });

      res.json({
        success: true,
        message: 'Shikoyat qabul qilindi va moderatorlar tomonidan koʻrib chiqiladi',
      });
    } catch (err: any) {
      console.error('reportUser xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Profilni tasdiqlash uchun selfie yuborish
   */
  static async submitVerification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'Selfie fotosurat yuklanmadi' });
        return;
      }

      const processed = await StorageService.processAndSaveImage(file.buffer);

      const verification = await prisma.verification.create({
        data: {
          userId,
          selfieUrl: processed.url,
          status: 'PENDING',
        },
      });

      res.json({
        success: true,
        message: 'Tasdiqlash arizasi qabul qilindi. Tez orada koʻrib chiqiladi.',
        verification,
      });
    } catch (err: any) {
      console.error('submitVerification xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

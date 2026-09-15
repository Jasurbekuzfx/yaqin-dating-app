import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';

export class AdminController {
  /**
   * Dashboard asosiy metrikalari
   */
  static async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        newUsersToday,
        activeUsers,
        premiumUsers,
        totalLikes,
        totalMatches,
        totalMessages,
        pendingReports,
        pendingVerifications,
        payments,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        prisma.user.count({ where: { isPremium: true } }),
        prisma.like.count(),
        prisma.match.count(),
        prisma.message.count(),
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.verification.count({ where: { status: 'PENDING' } }),
        prisma.payment.findMany({ where: { status: 'PAID' }, select: { amount: true, currency: true } }),
      ]);

      const totalRevenueUzs = payments
        .filter((p) => p.currency === 'UZS')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalStars = payments
        .filter((p) => p.currency === 'XTR')
        .reduce((sum, p) => sum + p.amount, 0);

      res.json({
        success: true,
        stats: {
          totalUsers,
          newUsersToday,
          activeUsers,
          premiumUsers,
          totalLikes,
          totalMatches,
          totalMessages,
          pendingReports,
          pendingVerifications,
          totalRevenueUzs,
          totalStars,
        },
      });
    } catch (err: any) {
      console.error('getDashboardStats xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchilarni qidirish va roʻyxati
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { username: { contains: search } },
          { telegramId: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            city: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        users: users.map((u) => ({
          id: u.id,
          telegramId: u.telegramId,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          gender: u.gender,
          cityName: u.city?.name || 'Kiritilmagan',
          isVerified: u.isVerified,
          isPremium: u.isPremium,
          isBanned: u.isBanned,
          photoUrl: u.photos[0]?.url || null,
          createdAt: u.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      console.error('getUsers xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchini Ban yoki Unban qilish
   */
  static async toggleBanUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id);
      const { isBanned } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isBanned: !!isBanned },
      });

      // Audit log yozish
      await prisma.auditLog.create({
        data: {
          adminId: req.admin?.id,
          action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
          targetType: 'USER',
          targetId: userId,
          details: JSON.stringify({ isBanned }),
        },
      });

      res.json({ success: true, isBanned: user.isBanned });
    } catch (err: any) {
      console.error('toggleBanUser xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Foydalanuvchini qo'lda Verifikatsiya qilish yoki bekor qilish
   */
  static async toggleVerifyUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id);
      const { isVerified } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: !!isVerified },
      });

      await prisma.auditLog.create({
        data: {
          adminId: req.admin?.id,
          action: isVerified ? 'VERIFY_USER' : 'UNVERIFY_USER',
          targetType: 'USER',
          targetId: userId,
        },
      });

      res.json({ success: true, isVerified: user.isVerified });
    } catch (err: any) {
      console.error('toggleVerifyUser xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Shikoyatlar (Reports) ro'yxati
   */
  static async getReports(_req: Request, res: Response): Promise<void> {
    try {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, firstName: true, username: true } },
          reported: {
            select: {
              id: true,
              firstName: true,
              username: true,
              isBanned: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      res.json({ success: true, reports });
    } catch (err: any) {
      console.error('getReports xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Shikoyatni hal qilish (Resolve / Dismiss)
   */
  static async updateReportStatus(req: Request, res: Response): Promise<void> {
    try {
      const reportId = String(req.params.id);
      const { status } = req.body; // "RESOLVED" | "DISMISSED"

      const report = await prisma.report.update({
        where: { id: reportId },
        data: { status },
      });

      res.json({ success: true, report });
    } catch (err: any) {
      console.error('updateReportStatus xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Verifikatsiya arizalari ro'yxati
   */
  static async getVerifications(_req: Request, res: Response): Promise<void> {
    try {
      const verifications = await prisma.verification.findMany({
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              isVerified: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      res.json({ success: true, verifications });
    } catch (err: any) {
      console.error('getVerifications xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Verifikatsiyani tasdiqlash yoki rad etish
   */
  static async reviewVerification(req: Request, res: Response): Promise<void> {
    try {
      const verificationId = String(req.params.id);
      const { status } = req.body; // "APPROVED" | "REJECTED"

      const verification = await prisma.verification.findUnique({
        where: { id: verificationId },
      });

      if (!verification) {
        res.status(404).json({ success: false, error: 'Ariza topilmadi' });
        return;
      }

      await prisma.$transaction([
        prisma.verification.update({
          where: { id: verificationId },
          data: {
            status,
            reviewedAt: new Date(),
            reviewerId: req.admin?.id,
          },
        }),
        prisma.user.update({
          where: { id: verification.userId },
          data: { isVerified: status === 'APPROVED' },
        }),
      ]);

      res.json({ success: true, message: `Ariza holati yangilandi: ${status}` });
    } catch (err: any) {
      console.error('reviewVerification xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * To'lovlar ro'yxati
   */
  static async getPayments(_req: Request, res: Response): Promise<void> {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              telegramId: true,
              username: true,
            },
          },
        },
      });

      res.json({ success: true, payments });
    } catch (err: any) {
      console.error('getPayments xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

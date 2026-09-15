import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@yaqin/database';
import { verifyTelegramInitData, generateToken } from '../middlewares/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yaqin-ultra-secure-jwt-secret-min-32-chars-long';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password + 'yaqin_salt_secure').digest('hex');
};

export class AuthController {
  /**
   * Telegram Mini App orqali kirish (initData tekshirish)
   */
  static async telegramAuth(req: Request, res: Response): Promise<void> {
    try {
      const { initData } = req.body;

      if (!initData) {
        res.status(400).json({ success: false, error: 'initData yuborilmadi' });
        return;
      }

      let telegramId: string;
      let firstName: string;
      let lastName: string | undefined;
      let username: string | undefined;

      // Development muhitida qulay test qilish uchun mock auth (faqat developmentda)
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && initData.startsWith('mock_')) {
        telegramId = initData.replace('mock_', '');
        firstName = 'Test Foydalanuvchi';
      } else {
        // Haqiqiy kriptografik tekshiruv
        const verification = verifyTelegramInitData(initData, BOT_TOKEN);
        if (!verification.isValid || !verification.telegramUser) {
          res.status(401).json({ success: false, error: 'Telegram initData tekshiruvidan oʻtmadi' });
          return;
        }
        telegramId = String(verification.telegramUser.id);
        firstName = verification.telegramUser.first_name || 'Foydalanuvchi';
        lastName = verification.telegramUser.last_name;
        username = verification.telegramUser.username;
      }

      // Foydalanuvchini topish yoki yaratish
      let user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          photos: true,
          userInterests: { include: { interest: true } },
          city: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        // Yangi foydalanuvchi — dastlabki yozuv (onboarding yakunlanishi kerak)
        user = await prisma.user.create({
          data: {
            telegramId,
            firstName,
            lastName,
            username,
            birthDate: new Date('2000-01-01'), // Onboardingda yangilanadi
            gender: 'MALE', // Onboardingda tanlanadi
            lookingFor: 'ALL',
          },
          include: {
            photos: true,
            userInterests: { include: { interest: true } },
            city: true,
          },
        });
      }

      const token = generateToken({ id: user.id, telegramId: user.telegramId });

      // Foydalanuvchi onboardingni yakunlaganmi? (kamida 1 ta rasm, cityId, bio/interests)
      const isOnboarded = user.photos.length > 0 && !!user.cityId;

      res.json({
        success: true,
        token,
        isOnboarded,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          isVerified: user.isVerified,
          isPremium: user.isPremium,
          isBlocked: user.isBlocked,
          isBanned: user.isBanned,
        },
      });
    } catch (err: any) {
      console.error('Telegram auth xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Admin tizimiga kirish (Email + Parol)
   */
  static async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email va parol kiritilishi shart' });
        return;
      }

      const admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!admin || !admin.isActive) {
        res.status(401).json({ success: false, error: 'Email yoki parol notoʻgʻri' });
        return;
      }

      const hashedPassword = hashPassword(password);
      if (admin.passwordHash !== hashedPassword) {
        res.status(401).json({ success: false, error: 'Email yoki parol notoʻgʻri' });
        return;
      }

      const token = jwt.sign(
        {
          sub: admin.id,
          email: admin.email,
          role: admin.role,
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (err: any) {
      console.error('Admin login xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

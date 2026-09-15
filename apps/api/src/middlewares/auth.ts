import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@yaqin/database';

export interface AuthenticatedUser {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName: string;
  isVerified: boolean;
  isPremium: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'yaqin-ultra-secure-jwt-secret-min-32-chars-long';

/**
 * Telegram initData ni HMAC-SHA256 orqali validatsiya qilish
 */
export const verifyTelegramInitData = (
  initData: string,
  botToken: string
): { isValid: boolean; telegramUser?: any } => {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { isValid: false };

    params.delete('hash');

    // Parametrlarni alifbo tartibida tartiblab, key=value\n shaklida birlashtirish
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((key) => `${key}=${params.get(key)}`).join('\n');

    // Secret key yaratish: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // Hisoblangan hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { isValid: false };
    }

    // auth_date eskirishini tekshirish (24 soat)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      // 24 soatdan eski
      return { isValid: false };
    }

    const userRaw = params.get('user');
    const telegramUser = userRaw ? JSON.parse(userRaw) : undefined;

    return { isValid: true, telegramUser };
  } catch (err) {
    return { isValid: false };
  }
};

/**
 * JWT token generatsiyasi
 */
export const generateToken = (user: { id: string; telegramId: string }): string => {
  return jwt.sign(
    {
      sub: user.id,
      telegramId: user.telegramId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Auth Middleware — barcha himoyalangan endpointlar uchun
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Avtorizatsiya talab qilinadi' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; telegramId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        isVerified: true,
        isPremium: true,
        isBanned: true,
        isBlocked: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Foydalanuvchi topilmadi' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({
        success: false,
        error: 'Sizning hisobingiz xavfsizlik qoidalarini buzganligi sababli bloklangan',
      });
      return;
    }

    req.user = {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Yaroqsiz yoki muddati oʻtgan token' });
  }
};

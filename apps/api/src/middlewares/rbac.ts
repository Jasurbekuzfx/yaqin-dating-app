import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@yaqin/database';

export interface AdminPayload {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'yaqin-ultra-secure-jwt-secret-min-32-chars-long';

export const requireAdmin = (requiredRole: 'ADMIN' | 'SUPERADMIN' = 'ADMIN') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Admin avtorizatsiyasi talab qilinadi' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: 'SUPERADMIN' | 'ADMIN' };

      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.sub },
      });

      if (!admin || !admin.isActive) {
        res.status(403).json({ success: false, error: 'Admin hisobi faol emas yoki mavjud emas' });
        return;
      }

      if (requiredRole === 'SUPERADMIN' && admin.role !== 'SUPERADMIN') {
        res.status(403).json({ success: false, error: 'Ushbu amal faqat SuperAdmin uchun ruxsat etilgan' });
        return;
      }

      req.admin = {
        id: admin.id,
        email: admin.email,
        role: admin.role as 'SUPERADMIN' | 'ADMIN',
      };

      next();
    } catch (err) {
      res.status(401).json({ success: false, error: 'Yaroqsiz admin tokeni' });
    }
  };
};

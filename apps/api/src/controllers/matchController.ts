import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { calculateAge } from '@yaqin/shared';

export class MatchController {
  /**
   * Barcha matchlar va chatlar ro'yxati
   */
  static async getMatches(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          userA: {
            include: {
              city: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
          userB: {
            include: {
              city: true,
              photos: { where: { isPrimary: true }, take: 1 },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      const formatted = matches.map((m) => {
        const partner = m.userAId === userId ? m.userB : m.userA;
        const lastMsg = m.messages[0] || null;

        return {
          id: m.id,
          createdAt: m.createdAt,
          lastMessageAt: m.lastMessageAt,
          partner: {
            id: partner.id,
            firstName: partner.firstName,
            lastName: partner.lastName,
            age: calculateAge(partner.birthDate),
            city: partner.city?.name || 'Oʻzbekiston',
            photoUrl: partner.photos[0]?.url || null,
            isVerified: partner.isVerified,
            isPremium: partner.isPremium,
          },
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt,
                isRead: lastMsg.isRead,
                senderId: lastMsg.senderId,
              }
            : null,
        };
      });

      res.json({
        success: true,
        matches: formatted,
      });
    } catch (err: any) {
      console.error('getMatches xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Bitta match ma'lumotlari
   */
  static async getMatchById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const matchId = String(req.params.id);

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          userA: {
            include: {
              city: true,
              photos: { orderBy: { sortOrder: 'asc' } },
              userInterests: { include: { interest: true } },
            },
          },
          userB: {
            include: {
              city: true,
              photos: { orderBy: { sortOrder: 'asc' } },
              userInterests: { include: { interest: true } },
            },
          },
        },
      });

      if (!match) {
        res.status(404).json({ success: false, error: 'Match topilmadi' });
        return;
      }

      if (match.userAId !== userId && match.userBId !== userId) {
        res.status(403).json({ success: false, error: 'Ushbu suhbatga kirish huquqingiz yoʻq' });
        return;
      }

      const partner = match.userAId === userId ? match.userB : match.userA;

      res.json({
        success: true,
        match: {
          id: match.id,
          createdAt: match.createdAt,
          partner: {
            id: partner.id,
            firstName: partner.firstName,
            lastName: partner.lastName,
            age: calculateAge(partner.birthDate),
            city: partner.city?.name,
            bio: partner.bio,
            isVerified: partner.isVerified,
            isPremium: partner.isPremium,
            photos: partner.photos.map((p: any) => ({
              id: p.id,
              url: p.url,
              sortOrder: p.sortOrder,
              isPrimary: p.isPrimary,
            })),
            interests: partner.userInterests.map((ui: any) => ui.interest.name),
          },
        },
      });
    } catch (err: any) {
      console.error('getMatchById xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

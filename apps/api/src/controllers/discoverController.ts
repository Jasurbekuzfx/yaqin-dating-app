import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import {
  rankCandidates,
  calculateAge,
  UserPreferences,
  CandidateScoringProfile,
} from '@yaqin/shared';

export class DiscoverController {
  /**
   * Discover — Deterministic tavsiyalar lentasi
   */
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 15;

      // 1. Joriy foydalanuvchini olish
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          city: true,
          userInterests: true,
          sentLikes: true,
          blockedUsers: true,
          blockedByUsers: true,
          matchesAsUserA: true,
          matchesAsUserB: true,
        },
      });

      if (!currentUser) {
        res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
        return;
      }

      // 2. Chiqarib tashlanishi shart bo'lgan ID lar to'plami
      const blockedIds = new Set<string>();
      currentUser.blockedUsers.forEach((b: any) => blockedIds.add(b.blockedId));
      currentUser.blockedByUsers.forEach((b: any) => blockedIds.add(b.blockerId));

      const excludedIds = new Set<string>();
      excludedIds.add(currentUser.id); // o'zi

      // Allaqachon like bosilganlar
      currentUser.sentLikes.forEach((l: any) => excludedIds.add(l.toUserId));

      // Allaqachon match bo'lganlar
      currentUser.matchesAsUserA.forEach((m: any) => excludedIds.add(m.userBId));
      currentUser.matchesAsUserB.forEach((m: any) => excludedIds.add(m.userAId));

      // 3. User preferensiyalarini tayyorlash
      const userPrefs: UserPreferences = {
        id: currentUser.id,
        gender: currentUser.gender as 'MALE' | 'FEMALE',
        lookingFor: currentUser.lookingFor as 'MALE' | 'FEMALE' | 'ALL',
        cityId: currentUser.cityId,
        region: currentUser.city?.region,
        birthDate: currentUser.birthDate,
        interestIds: currentUser.userInterests.map((ui: any) => ui.interestId),
        blockedUserIds: blockedIds,
        excludedUserIds: excludedIds,
      };

      // 4. Query filtrlari
      const cityIdFilter = req.query.cityId as string;
      const genderFilter = req.query.gender as string;
      const verifiedOnly = req.query.verifiedOnly === 'true';
      const minAge = parseInt(req.query.minAge as string) || 18;
      const maxAge = parseInt(req.query.maxAge as string) || 80;

      const whereClause: any = {
        id: { notIn: Array.from(new Set([...excludedIds, ...blockedIds])) },
        isBanned: false,
        isBlocked: false,
        photos: { some: {} }, // kamida 1 ta fotosurati borlar
      };

      if (cityIdFilter) whereClause.cityId = cityIdFilter;
      if (genderFilter && ['MALE', 'FEMALE'].includes(genderFilter)) whereClause.gender = genderFilter;
      if (verifiedOnly) whereClause.isVerified = true;
      if (minAge > 18 || maxAge < 80) {
        const now = new Date();
        const maxBirth = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
        const minBirth = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
        whereClause.birthDate = {
          gte: minBirth,
          lte: maxBirth,
        };
      }

      let rawCandidates = await prisma.user.findMany({
        where: whereClause,
        include: {
          city: true,
          photos: { orderBy: { sortOrder: 'asc' } },
          userInterests: { include: { interest: true } },
          boosts: {
            where: { expiresAt: { gt: new Date() } },
            orderBy: { expiresAt: 'desc' },
            take: 1,
          },
        },
      });

      // Dev mode fallback: agar hamma profillar like/skip qilingan bo'lsa, test profillarni qayta ko'rsatish
      if (rawCandidates.length === 0 && process.env.NODE_ENV !== 'production') {
        const devWhere: any = {
          id: { not: currentUser.id },
          isBanned: false,
          isBlocked: false,
          photos: { some: {} },
        };
        if (cityIdFilter) devWhere.cityId = cityIdFilter;
        if (genderFilter && ['MALE', 'FEMALE'].includes(genderFilter)) devWhere.gender = genderFilter;
        if (verifiedOnly) devWhere.isVerified = true;

        rawCandidates = await prisma.user.findMany({
          where: devWhere,
          include: {
            city: true,
            photos: { orderBy: { sortOrder: 'asc' } },
            userInterests: { include: { interest: true } },
            boosts: {
              where: { expiresAt: { gt: new Date() } },
              orderBy: { expiresAt: 'desc' },
              take: 1,
            },
          },
        });
      }

      // 5. Scoring profil formatiga o'tkazish
      const candidateProfiles: CandidateScoringProfile[] = rawCandidates.map((c: any) => ({
        id: c.id,
        birthDate: c.birthDate,
        gender: c.gender as 'MALE' | 'FEMALE',
        cityId: c.cityId,
        region: c.city?.region,
        bio: c.bio,
        isVerified: c.isVerified,
        isPremium: c.isPremium,
        isBlocked: c.isBlocked,
        isBanned: c.isBanned,
        activeBoostUntil: c.boosts?.[0] ? c.boosts[0].expiresAt : null,
        lastActiveAt: c.lastActiveAt,
        photosCount: c.photos?.length || 0,
        interestIds: (c.userInterests || []).map((ui: any) => ui.interestId),
      }));

      // 6. Deterministic scoring algoritmi orqali saralash
      const ranked = rankCandidates(userPrefs, candidateProfiles);
      const topCandidateIds = ranked.slice(0, limit).map((r) => r.candidateId);

      // 7. Yakuniy natijani DiscoverCard formatida qaytarish
      const candidateMap = new Map(rawCandidates.map((c: any) => [c.id, c]));
      const scoreMap = new Map(ranked.map((r) => [r.candidateId, r.score]));

      const results = topCandidateIds
        .map((id) => {
          const c: any = candidateMap.get(id);
          if (!c) return null;
          return {
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            age: calculateAge(c.birthDate),
            city: c.city?.name || 'Oʻzbekiston',
            bio: c.bio,
            isVerified: c.isVerified,
            isPremium: c.isPremium,
            isBoosted: !!c.boosts?.[0],
            matchScore: scoreMap.get(c.id) || 100,
            photos: (c.photos || []).map((p: any) => ({
              id: p.id,
              url: p.url,
              sortOrder: p.sortOrder,
              isPrimary: p.isPrimary,
            })),
            interests: (c.userInterests || []).map((ui: any) => ({
              id: ui.interest?.id,
              name: ui.interest?.name,
              category: ui.interest?.category,
              icon: ui.interest?.icon,
            })),
          };
        })
        .filter(Boolean);

      res.json({
        success: true,
        candidates: results,
        totalRemaining: Math.max(0, ranked.length - limit),
      });
    } catch (err: any) {
      console.error('getRecommendations xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Nomzodni o'tkazib yuborish (Skip)
   */
  static async skipCandidate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const targetUserId = String(req.params.userId);

      if (userId === targetUserId) {
        res.status(400).json({ success: false, error: 'Oʻzingizni skip qila olmaysiz' });
        return;
      }

      await prisma.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: targetUserId,
          },
        },
        create: {
          fromUserId: userId,
          toUserId: targetUserId,
          type: 'SKIP' as any,
        },
        update: {},
      });

      res.json({ success: true, message: 'Nomzod oʻtkazib yuborildi' });
    } catch (err: any) {
      console.error('skipCandidate xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

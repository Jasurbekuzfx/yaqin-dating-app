import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { isAtLeast18YearsOld, calculateAge } from '@yaqin/shared';
import { StorageService } from '../services/storageService.js';

export class ProfileController {
  /**
   * Oʻz profilini olish
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        res.status(404).json({ success: false, error: 'Profil topilmadi' });
        return;
      }

      const activeBoost = user.boosts[0] || null;

      res.json({
        success: true,
        profile: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          birthDate: user.birthDate ? user.birthDate.toISOString().split('T')[0] : null,
          age: user.birthDate ? calculateAge(user.birthDate) : 18,
          gender: user.gender,
          lookingFor: user.lookingFor,
          cityId: user.cityId,
          cityName: user.city?.name || null,
          cityRegion: user.city?.region || null,
          bio: user.bio || '',
          isVerified: user.isVerified,
          isPremium: user.isPremium,
          premiumUntil: user.premiumUntil,
          superLikeBalance: user.superLikeBalance,
          activeBoostUntil: activeBoost ? activeBoost.expiresAt : null,
          photos: (user.photos || []).map((p) => ({
            id: p.id,
            url: p.url,
            sortOrder: p.sortOrder,
            isPrimary: p.isPrimary,
          })),
          interests: (user.userInterests || []).map((ui) => ({
            id: ui.interest.id,
            name: ui.interest.name,
            category: ui.interest.category,
            icon: ui.interest.icon,
          })),
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      console.error('getMe xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Profilni yangilash yoki Onboarding yakunlash
   */
  static async updateMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        firstName,
        lastName,
        birthDate,
        gender,
        lookingFor,
        cityId,
        bio,
        interestIds,
      } = req.body;

      const updateData: any = {};

      if (firstName) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName ? lastName.trim() : null;
      if (bio !== undefined) updateData.bio = bio ? bio.trim() : null;
      if (gender && ['MALE', 'FEMALE'].includes(gender)) updateData.gender = gender;
      if (lookingFor && ['MALE', 'FEMALE', 'ALL'].includes(lookingFor)) updateData.lookingFor = lookingFor;
      if (cityId) updateData.cityId = cityId;

      if (birthDate) {
        if (!isAtLeast18YearsOld(birthDate)) {
          res.status(400).json({
            success: false,
            error: 'Platformadan faqat 18 yoshga toʻlgan shaxslar foydalanishi mumkin',
          });
          return;
        }
        updateData.birthDate = new Date(birthDate);
      }

      if (Array.isArray(interestIds)) {
        await prisma.userInterest.deleteMany({ where: { userId } });
        if (interestIds.length > 0) {
          await prisma.userInterest.createMany({
            data: interestIds.map((id: string) => ({
              userId,
              interestId: id,
            })),
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          city: true,
          photos: { orderBy: { sortOrder: 'asc' } },
          userInterests: { include: { interest: true } },
        },
      });

      res.json({
        success: true,
        profile: updatedUser,
      });
    } catch (err: any) {
      console.error('updateMe xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Fotosurat yuklash
   */
  static async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'Fayl tanlanmadi' });
        return;
      }

      const existingPhotosCount = await prisma.profilePhoto.count({
        where: { userId },
      });

      if (existingPhotosCount >= 6) {
        res.status(400).json({
          success: false,
          error: 'Koʻpi bilan 6 ta fotosurat yuklash mumkin',
        });
        return;
      }

      const processed = await StorageService.processAndSaveImage(file.buffer);
      const isPrimary = existingPhotosCount === 0;

      const photo = await prisma.profilePhoto.create({
        data: {
          userId,
          url: processed.url,
          sortOrder: existingPhotosCount,
          isPrimary,
        },
      });

      res.json({
        success: true,
        photo,
      });
    } catch (err: any) {
      console.error('uploadPhoto xatolik:', err);
      res.status(500).json({ success: false, error: 'Rasm yuklashda xatolik yuz berdi' });
    }
  }

  /**
   * Fotosuratni oʻchirish
   */
  static async deletePhoto(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const photoId = String(req.params.id);

      const photo = await prisma.profilePhoto.findFirst({
        where: { id: photoId, userId },
      });

      if (!photo) {
        res.status(404).json({ success: false, error: 'Fotosurat topilmadi' });
        return;
      }

      await prisma.profilePhoto.delete({ where: { id: photoId } });

      if (photo.isPrimary) {
        const nextPhoto = await prisma.profilePhoto.findFirst({
          where: { userId },
          orderBy: { sortOrder: 'asc' },
        });
        if (nextPhoto) {
          await prisma.profilePhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true },
          });
        }
      }

      const filename = photo.url.split('/').pop();
      if (filename) {
        await StorageService.deleteImage(filename);
      }

      res.json({ success: true, message: 'Fotosurat oʻchirildi' });
    } catch (err: any) {
      console.error('deletePhoto xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * Umumiy konfiguratsiya ma'lumotlari (Shaharlar, Qiziqishlar)
   */
  static async getConfig(_req: Request, res: Response): Promise<void> {
    try {
      const [cities, interests] = await Promise.all([
        prisma.city.findMany({ orderBy: { name: 'asc' } }),
        prisma.interest.findMany({ orderBy: { category: 'asc' } }),
      ]);

      res.json({
        success: true,
        cities,
        interests,
      });
    } catch (err: any) {
      console.error('getConfig xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

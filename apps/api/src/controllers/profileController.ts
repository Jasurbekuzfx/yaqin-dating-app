import { Request, Response } from 'express';
import { prisma } from '@yaqin/database';
import { isAtLeast18YearsOld, calculateAge, UZBEKISTAN_CITIES_AND_DISTRICTS } from '@yaqin/shared';
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
      if (cityId) {
        let targetCity = await prisma.city.findUnique({ where: { id: cityId } }).catch(() => null);
        if (!targetCity) {
          targetCity = await prisma.city.findFirst({ where: { name: cityId } }).catch(() => null);
        }
        if (!targetCity) {
          try {
            targetCity = await prisma.city.create({
              data: { name: cityId, region: 'Oʻzbekiston' },
            });
          } catch {
            targetCity = await prisma.city.findFirst().catch(() => null);
          }
        }
        if (targetCity) {
          updateData.cityId = targetCity.id;
        }
      }

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
        await prisma.userInterest.deleteMany({ where: { userId } }).catch(() => {});
        if (interestIds.length > 0) {
          for (const item of interestIds) {
            let intRecord = await prisma.interest.findUnique({ where: { id: item } }).catch(() => null);
            if (!intRecord) {
              intRecord = await prisma.interest.findFirst({ where: { name: item } }).catch(() => null);
            }
            if (!intRecord) {
              try {
                intRecord = await prisma.interest.create({
                  data: { name: item, category: 'GENERAL', icon: '✨' },
                });
              } catch {
                // ignore
              }
            }
            if (intRecord) {
              await prisma.userInterest.create({
                data: { userId, interestId: intRecord.id },
              }).catch(() => {});
            }
          }
        }
      }

      const { photoUrls } = req.body;
      if (Array.isArray(photoUrls) && photoUrls.length > 0) {
        const existingCount = await prisma.profilePhoto.count({ where: { userId } }).catch(() => 0);
        if (existingCount === 0) {
          for (let i = 0; i < photoUrls.length; i++) {
            const pUrl = photoUrls[i];
            if (pUrl && !pUrl.startsWith('blob:')) {
              await prisma.profilePhoto.create({
                data: {
                  userId,
                  url: pUrl,
                  sortOrder: i,
                  isPrimary: i === 0,
                },
              }).catch(() => {});
            }
          }
        }
      }

      // Agar hali ham rasm bo'lmasa, chiroyli default avatar yaratamiz
      const currentPhotoCount = await prisma.profilePhoto.count({ where: { userId } }).catch(() => 0);
      if (currentPhotoCount === 0) {
        const fallbackName = firstName || 'Yaqin';
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=FF4B6E&color=fff&size=512&bold=true`;
        await prisma.profilePhoto.create({
          data: {
            userId,
            url: defaultAvatar,
            sortOrder: 0,
            isPrimary: true,
          },
        }).catch(() => {});
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
      let [cities, interests] = await Promise.all([
        prisma.city.findMany({ orderBy: { name: 'asc' } }).catch(() => []),
        prisma.interest.findMany({ orderBy: { category: 'asc' } }).catch(() => []),
      ]);

      if (!cities || cities.length === 0) {
        cities = UZBEKISTAN_CITIES_AND_DISTRICTS.map((c) => ({
          id: c.name,
          name: c.name,
          region: c.region,
          createdAt: new Date(),
        })) as any;
      }

      if (!interests || interests.length === 0) {
        const DEFAULT_INTERESTS = [
          { id: 'Sayohat', name: 'Sayohat', icon: '✈️', category: 'LIFESTYLE' },
          { id: 'Kitob', name: 'Kitob mutolaasi', icon: '📚', category: 'CULTURE' },
          { id: 'Sport', name: 'Sport & Fitnes', icon: '⚽', category: 'SPORTS' },
          { id: 'Kinolar', name: 'Kino & Seriallar', icon: '🎬', category: 'ENTERTAINMENT' },
          { id: 'Musiqa', name: 'Musiqa', icon: '🎵', category: 'ENTERTAINMENT' },
          { id: 'IT', name: 'IT & Dasturlash', icon: '💻', category: 'TECH' },
          { id: 'Sanat', name: 'Sanʼat & Rasm', icon: '🎨', category: 'ART' },
          { id: 'Pazandachilik', name: 'Pazandachilik', icon: '🍳', category: 'FOOD' },
          { id: 'Qahva', name: 'Qahvaxonalar', icon: '☕', category: 'LIFESTYLE' },
          { id: 'Fotografiya', name: 'Fotografiya', icon: '📸', category: 'CREATIVE' },
          { id: 'Moda', name: 'Moda & Stil', icon: '👗', category: 'FASHION' },
          { id: 'Biznes', name: 'Biznes & Startap', icon: '💼', category: 'CAREER' },
          { id: 'Avtomobillar', name: 'Avtomobillar', icon: '🚗', category: 'AUTO' },
          { id: 'Til', name: 'Til oʻrganish', icon: '🗣️', category: 'EDUCATION' },
          { id: 'Oyinlar', name: 'Video oʻyinlar', icon: '🎮', category: 'GAMING' },
          { id: 'Tabiat', name: 'Tabiat & Togʻ', icon: '🏔️', category: 'OUTDOOR' },
        ];
        interests = DEFAULT_INTERESTS as any;
      }

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

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');

// Papkani mavjudligini ta'minlash
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface ProcessedImage {
  filename: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export class StorageService {
  /**
   * Rasmni xavfsiz qayta ishlash:
   * - EXIF metama'lumotlarini tozalash (GPS koordinatalari va kamerani o'chirish)
   * - Optimal WebP formatga o'tkazish
   * - Max 1200x1200px o'lchamga keltirish
   * - Kichik thumbnail (300x300px) hosil qilish
   */
  static async processAndSaveImage(buffer: Buffer): Promise<ProcessedImage> {
    const fileId = crypto.randomUUID();
    const filename = `${fileId}.webp`;
    const thumbFilename = `${fileId}_thumb.webp`;

    const filePath = path.join(UPLOAD_DIR, filename);
    const thumbPath = path.join(UPLOAD_DIR, thumbFilename);

    // Asosiy rasm
    const imageInfo = await sharp(buffer)
      .rotate() // EXIF orientation bo'yicha to'g'rilash
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filePath);

    // Kichik rasm (thumbnail)
    await sharp(buffer)
      .rotate()
      .resize(320, 320, { fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    const rawApiUrl = process.env.API_URL || process.env.RENDER_EXTERNAL_URL || '';
    const apiUrl = rawApiUrl.replace(/\/$/, '');

    return {
      filename,
      url: apiUrl ? `${apiUrl}/uploads/${filename}` : `/uploads/${filename}`,
      thumbnailUrl: apiUrl ? `${apiUrl}/uploads/${thumbFilename}` : `/uploads/${thumbFilename}`,
      width: imageInfo.width || 800,
      height: imageInfo.height || 800,
    };
  }

  static async deleteImage(filename: string): Promise<void> {
    try {
      const filePath = path.join(UPLOAD_DIR, filename);
      const thumbPath = path.join(UPLOAD_DIR, filename.replace('.webp', '_thumb.webp'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch (e) {
      console.error('Faylni oʻchirishda xatolik:', e);
    }
  }
}

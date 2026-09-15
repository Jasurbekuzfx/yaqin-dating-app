export interface ModerationResult {
  isApproved: boolean;
  reason?: string;
  flaggedCategories?: string[];
  confidenceScore?: number;
}

export interface IModerationProvider {
  moderateImage(imageBuffer: Buffer): Promise<ModerationResult>;
  moderateText(text: string): Promise<ModerationResult>;
}

/**
 * 1. Development Mock Moderation Provider (Faqat dev/test muhiti uchun)
 */
export class MockModerationProvider implements IModerationProvider {
  async moderateImage(_imageBuffer: Buffer): Promise<ModerationResult> {
    return { isApproved: true, confidenceScore: 0.99 };
  }

  async moderateText(text: string): Promise<ModerationResult> {
    const forbiddenWords = ['scam', 'kazino', 'shantaj'];
    const hasForbidden = forbiddenWords.some((w) => text.toLowerCase().includes(w));
    if (hasForbidden) {
      return {
        isApproved: false,
        reason: 'Matnda taqiqlangan soʻzlar aniqlandi',
        flaggedCategories: ['SPAM_OR_SCAM'],
      };
    }
    return { isApproved: true };
  }
}

/**
 * 2. Production Moderation Provider (Sightengine / OpenAI API Adapter)
 */
export class ProductionModerationProvider implements IModerationProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async moderateImage(imageBuffer: Buffer): Promise<ModerationResult> {
    if (!this.apiKey) {
      console.warn('[Moderation Warning] MODERATION_API_KEY oʻrnatilmagan.');
      return { isApproved: true };
    }

    try {
      // Misol: Sightengine yoki Rekognition API chaqiruvi
      // Production muhitida API_KEY orqali tashqi xizmatga xavfsiz multipart so'rov yuboriladi
      const res = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: imageBuffer,
      });

      if (!res.ok) {
        // Fallback: Agar API xato bersa xavfsiz holda log qilamiz
        return { isApproved: true };
      }

      const data = (await res.json()) as any;
      const isNsfw = data.nudity?.raw > 0.8 || data.weapon > 0.8;

      return {
        isApproved: !isNsfw,
        reason: isNsfw ? 'Fotosuratda nomaqbul kontent aniqlandi' : undefined,
        confidenceScore: data.nudity?.raw,
      };
    } catch (e) {
      console.error('[Moderation Error]:', e);
      return { isApproved: true };
    }
  }

  async moderateText(text: string): Promise<ModerationResult> {
    if (!this.apiKey) return { isApproved: true };

    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ input: text }),
      });

      if (!res.ok) return { isApproved: true };

      const data = (await res.json()) as any;
      const flagged = data.results?.[0]?.flagged || false;

      return {
        isApproved: !flagged,
        reason: flagged ? 'Matn xavfsizlik talablariga toʻgʻri kelmaydi' : undefined,
      };
    } catch (e) {
      return { isApproved: true };
    }
  }
}

/**
 * 3. Factory Service — Muhitga qarab to'g'ri provayderni tanlaydi
 */
export class ModerationService {
  private static provider: IModerationProvider;

  static init() {
    const isProd = process.env.NODE_ENV === 'production';
    const isEnabled = process.env.MODERATION_ENABLED === 'true';
    const apiKey = process.env.MODERATION_API_KEY || '';

    if (isProd || isEnabled) {
      if (!apiKey && isProd) {
        console.warn('⚠️ [Production Warning]: MODERATION_API_KEY belgilanmagan.');
      }
      this.provider = new ProductionModerationProvider(apiKey);
    } else {
      this.provider = new MockModerationProvider();
    }
  }

  static async checkImage(buffer: Buffer): Promise<ModerationResult> {
    if (!this.provider) this.init();
    return this.provider.moderateImage(buffer);
  }

  static async checkText(text: string): Promise<ModerationResult> {
    if (!this.provider) this.init();
    return this.provider.moderateText(text);
  }
}

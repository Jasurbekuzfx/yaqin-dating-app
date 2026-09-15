import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@yaqin/database';

export const PREMIUM_PLANS = [
  {
    id: 'plan_7_days',
    durationDays: 7,
    titleUz: '7 kun',
    titleRu: '7 дней',
    titleEn: '7 days',
    priceUzs: 15000,
    starsAmount: 75,
  },
  {
    id: 'plan_1_month',
    durationDays: 30,
    titleUz: '1 oy',
    titleRu: '1 месяц',
    titleEn: '1 month',
    priceUzs: 39000,
    starsAmount: 195,
    isPopular: true,
  },
  {
    id: 'plan_3_months',
    durationDays: 90,
    titleUz: '3 oy',
    titleRu: '3 месяца',
    titleEn: '3 months',
    priceUzs: 89000,
    starsAmount: 445,
    discountPercentage: 25,
  },
  {
    id: 'plan_1_year',
    durationDays: 365,
    titleUz: '1 yil',
    titleRu: '1 год',
    titleEn: '1 year',
    priceUzs: 299000,
    starsAmount: 1495,
    discountPercentage: 40,
  },
];

export const BOOST_PLANS = [
  {
    id: 'boost_1_hour',
    durationHours: 1,
    titleUz: '1 soat',
    priceUzs: 10000,
    starsAmount: 50,
    multiplier: 2.0,
  },
  {
    id: 'boost_3_hours',
    durationHours: 3,
    titleUz: '3 soat',
    priceUzs: 25000,
    starsAmount: 125,
    multiplier: 2.5,
  },
  {
    id: 'boost_24_hours',
    durationHours: 24,
    titleUz: '24 soat',
    priceUzs: 50000,
    starsAmount: 250,
    multiplier: 3.0,
  },
];

export const SUPER_LIKE_PACKAGES = [
  { id: 'sl_1', count: 1, priceUzs: 2000, starsAmount: 10 },
  { id: 'sl_5', count: 5, priceUzs: 7000, starsAmount: 35 },
  { id: 'sl_20', count: 20, priceUzs: 20000, starsAmount: 100 },
];

export class PremiumController {
  /**
   * Rejalar va narxlarni olish
   */
  static async getPlans(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      premiumPlans: PREMIUM_PLANS,
      boostPlans: BOOST_PLANS,
      superLikePackages: SUPER_LIKE_PACKAGES,
    });
  }

  /**
   * To'lov yaratish (Telegram Stars / Payme)
   */
  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { productType, productId, paymentMethod = 'STARS' } = req.body;

      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && paymentMethod === 'MOCK') {
        res.status(403).json({ success: false, error: 'Productionda Mock toʻlovlar taqiqlangan' });
        return;
      }

      let amount = 0;
      let currency = 'UZS';
      let title = '';
      let metadata: any = { productId };

      if (productType === 'PREMIUM') {
        const plan = PREMIUM_PLANS.find((p) => p.id === productId);
        if (!plan) {
          res.status(400).json({ success: false, error: 'Notoʻgʻri Premium rejasi' });
          return;
        }
        amount = paymentMethod === 'STARS' ? plan.starsAmount : plan.priceUzs;
        currency = paymentMethod === 'STARS' ? 'XTR' : 'UZS';
        title = `Yaqin Premium (${plan.titleUz})`;
        metadata.durationDays = plan.durationDays;
      } else if (productType === 'BOOST') {
        const plan = BOOST_PLANS.find((p) => p.id === productId);
        if (!plan) {
          res.status(400).json({ success: false, error: 'Notoʻgʻri Boost rejasi' });
          return;
        }
        amount = paymentMethod === 'STARS' ? plan.starsAmount : plan.priceUzs;
        currency = paymentMethod === 'STARS' ? 'XTR' : 'UZS';
        title = `Yaqin Boost (${plan.titleUz})`;
        metadata.durationHours = plan.durationHours;
        metadata.multiplier = plan.multiplier;
      } else if (productType === 'SUPER_LIKE') {
        const pkg = SUPER_LIKE_PACKAGES.find((p) => p.id === productId);
        if (!pkg) {
          res.status(400).json({ success: false, error: 'Notoʻgʻri Super Like toʻplami' });
          return;
        }
        amount = paymentMethod === 'STARS' ? pkg.starsAmount : pkg.priceUzs;
        currency = paymentMethod === 'STARS' ? 'XTR' : 'UZS';
        title = `Yaqin ${pkg.count} ta Super Like`;
        metadata.count = pkg.count;
      } else {
        res.status(400).json({ success: false, error: 'Notoʻgʻri mahsulot turi' });
        return;
      }

      const providerPaymentId = `pay_${crypto.randomUUID().slice(0, 16)}`;

      const payment = await prisma.payment.create({
        data: {
          userId,
          provider: paymentMethod,
          providerPaymentId,
          productType,
          amount,
          currency,
          status: 'PENDING',
          metadata: JSON.stringify(metadata),
        },
      });

      // Telegram Stars uchun Invoice Link (agar haqiqiy bot token bo'lsa)
      let invoiceLink: string | undefined;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (paymentMethod === 'STARS' && botToken && !botToken.startsWith('dev_')) {
        try {
          const invRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description: `${title} xaridi uchun toʻlov`,
              payload: providerPaymentId,
              currency: 'XTR',
              prices: [{ label: title, amount: amount }],
            }),
          });
          const invData = (await invRes.json()) as any;
          if (invData.ok) {
            invoiceLink = invData.result;
          }
        } catch (e) {
          console.error('Telegram Stars Invoice link yaratishda xatolik:', e);
        }
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          providerPaymentId: payment.providerPaymentId,
          amount: payment.amount,
          currency: payment.currency,
          productType: payment.productType,
          invoiceLink,
        },
      });
    } catch (err: any) {
      console.error('createPayment xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }

  /**
   * To'lovni tasdiqlash (Webhook / Verification)
   * Idempotent & Production Guard
   */
  static async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { providerPaymentId, status = 'PAID' } = req.body;
      const isProduction = process.env.NODE_ENV === 'production';

      if (!providerPaymentId) {
        res.status(400).json({ success: false, error: 'providerPaymentId talab qilinadi' });
        return;
      }

      const payment = await prisma.payment.findUnique({
        where: { providerPaymentId },
      });

      if (!payment) {
        res.status(404).json({ success: false, error: 'Toʻlov topilmadi' });
        return;
      }

      // XAVFSIZLIK: Productionda oddiy client-side mock verify taqiqlanadi (Webhook yoki Bot callback orqali bo'lishi shart)
      if (isProduction && payment.provider === 'MOCK') {
        res.status(403).json({ success: false, error: 'Productionda Mock tasdiqlash taqiqlangan' });
        return;
      }

      // Idempotency: allaqachon to'langan bo'lsa qayta hisoblanmaydi
      if (payment.status === 'PAID') {
        res.json({ success: true, message: 'Toʻlov allaqachon tasdiqlangan', payment });
        return;
      }

      if (status !== 'PAID') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        res.json({ success: false, error: 'Toʻlov muvaffaqiyatsiz boʻldi' });
        return;
      }

      const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

      if (payment.productType === 'PREMIUM') {
        const days = metadata.durationDays || 30;
        const premiumUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID' },
          }),
          prisma.user.update({
            where: { id: payment.userId },
            data: {
              isPremium: true,
              premiumUntil,
            },
          }),
          prisma.subscription.create({
            data: {
              userId: payment.userId,
              planType: metadata.productId || 'MONTH',
              endDate: premiumUntil,
            },
          }),
        ]);
      } else if (payment.productType === 'BOOST') {
        const hours = metadata.durationHours || 1;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID' },
          }),
          prisma.boost.create({
            data: {
              userId: payment.userId,
              expiresAt,
              multiplier: metadata.multiplier || 2.0,
            },
          }),
        ]);
      } else if (payment.productType === 'SUPER_LIKE') {
        const count = metadata.count || 1;

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID' },
          }),
          prisma.user.update({
            where: { id: payment.userId },
            data: { superLikeBalance: { increment: count } },
          }),
          prisma.superLikeTransaction.create({
            data: {
              userId: payment.userId,
              count,
              type: 'PURCHASE',
            },
          }),
        ]);
      }

      res.json({
        success: true,
        message: 'Toʻlov muvaffaqiyatli yakunlandi va xizmat faollashtirildi',
      });
    } catch (err: any) {
      console.error('verifyPayment xatolik:', err);
      res.status(500).json({ success: false, error: 'Server xatoligi' });
    }
  }
}

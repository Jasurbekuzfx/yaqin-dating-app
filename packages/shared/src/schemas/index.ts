import { z } from 'zod';

// Yordamchi: Kamida 18 yosh ekanligini hisoblash
export const isAtLeast18YearsOld = (birthDateStr: string): boolean => {
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18 && age <= 100;
};

// 1. Onboarding & Registration Schema
export const OnboardingSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 ta harfdan iborat bo'lishi kerak").max(50),
  lastName: z.string().max(50).optional().nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak")
    .refine((date) => isAtLeast18YearsOld(date), {
      message: "Platformadan faqat 18 yoshga to'lgan shaxslar foydalanishi mumkin",
    }),
  gender: z.enum(['MALE', 'FEMALE'], {
    errorMap: () => ({ message: "Jinsni to'g'ri tanlang (MALE yoki FEMALE)" }),
  }),
  lookingFor: z.enum(['MALE', 'FEMALE', 'ALL'], {
    errorMap: () => ({ message: "Qidirayotgan jinsingizni tanlang" }),
  }),
  cityId: z.string().min(1, 'Shaharni tanlang'),
  bio: z.string().max(500, "Bio 500 ta belgidan oshmasligi kerak").optional().nullable(),
  interestIds: z
    .array(z.string())
    .min(1, "Kamida 1 ta qiziqishni tanlang")
    .max(10, "Ko'pi bilan 10 ta qiziqish tanlash mumkin"),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

// 2. Profile Update Schema
export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  cityId: z.string().optional().nullable(),
  lookingFor: z.enum(['MALE', 'FEMALE', 'ALL']).optional(),
  interestIds: z.array(z.string()).max(10).optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;

// 3. Telegram InitData Auth Schema
export const TelegramAuthPayloadSchema = z.object({
  initData: z.string().min(1, "initData talab qilinadi"),
});

// 4. Like / SuperLike Action Schema
export const LikeActionSchema = z.object({
  targetUserId: z.string().min(1, "Foydalanuvchi ID si talab qilinadi"),
  type: z.enum(['LIKE', 'SUPER_LIKE']).default('LIKE'),
});

// 5. Send Message Schema
export const SendMessageSchema = z.object({
  content: z.string().min(1, "Xabar bo'sh bo'lishi mumkin emas").max(2000),
  type: z.enum(['TEXT', 'IMAGE', 'VOICE']).default('TEXT'),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// 6. Report User Schema
export const ReportUserSchema = z.object({
  reportedId: z.string().min(1, "Shikoyat qilinayotgan foydalanuvchi ID si kerak"),
  reason: z.enum([
    'FAKE_PROFILE',
    'HARASSMENT',
    'SPAM',
    'INAPPROPRIATE_CONTENT',
    'SCAM',
    'OTHER',
  ]),
  description: z.string().max(1000).optional().nullable(),
});

export type ReportUserInput = z.infer<typeof ReportUserSchema>;

// 7. Block User Schema
export const BlockUserSchema = z.object({
  targetUserId: z.string().min(1, "Bloklanayotgan foydalanuvchi ID si kerak"),
});

// 8. Payment Creation Schema
export const CreatePaymentSchema = z.object({
  productType: z.enum(['PREMIUM', 'BOOST', 'SUPER_LIKE']),
  productId: z.string().min(1, "Mahsulot ID si kerak"),
  paymentMethod: z.enum(['STARS', 'MOCK']).default('STARS'),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

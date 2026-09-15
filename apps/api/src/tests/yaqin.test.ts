import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  isAtLeast18YearsOld,
  calculateAge,
  passesHardFilters,
  calculateCandidateScore,
  rankCandidates,
  UserPreferences,
  CandidateScoringProfile,
} from '@yaqin/shared';
import { verifyTelegramInitData } from '../middlewares/auth.js';

describe('1. Telegram initData HMAC-SHA256 Validation', () => {
  const botToken = '123456789:ABCDefghIJKlmNoPQRsTUVwxyZ';

  it('Haqiqiy Telegram initData muvaffaqiyatli tekshirilishi kerak', () => {
    const userObj = { id: 987654321, first_name: 'Alisher', username: 'alisher_uz' };
    const authDate = Math.floor(Date.now() / 1000);

    const params = new URLSearchParams();
    params.set('auth_date', String(authDate));
    params.set('user', JSON.stringify(userObj));

    // Secret key: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

    // Data-check-string
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((k) => `${k}=${params.get(k)}`).join('\n');

    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    params.set('hash', hash);

    const result = verifyTelegramInitData(params.toString(), botToken);
    expect(result.isValid).toBe(true);
    expect(result.telegramUser.id).toBe(987654321);
    expect(result.telegramUser.first_name).toBe('Alisher');
  });

  it('Qalbaki yoki buzilgan hash rad etilishi kerak', () => {
    const fakeInitData = 'auth_date=1700000000&user={"id":123}&hash=fake_invalid_hash_value';
    const result = verifyTelegramInitData(fakeInitData, botToken);
    expect(result.isValid).toBe(false);
  });
});

describe('2. Yosh va 18+ Cheklovi Validatsiyasi', () => {
  it('18 yoshdan kattalarga ruxsat berilishi kerak', () => {
    expect(isAtLeast18YearsOld('2000-01-01')).toBe(true);
    expect(isAtLeast18YearsOld('1995-05-20')).toBe(true);
  });

  it('18 yoshdan kichiklar qatʼiy rad etilishi kerak', () => {
    const today = new Date();
    const under18 = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
      .toISOString()
      .split('T')[0];
    expect(isAtLeast18YearsOld(under18)).toBe(false);
  });

  it('calculateAge yoshni toʻgʻri hisoblashi kerak', () => {
    const age = calculateAge('2000-01-01');
    expect(age).toBeGreaterThanOrEqual(24);
  });
});

describe('3. Deterministic Recommendation Scoring Engine', () => {
  const currentUser: UserPreferences = {
    id: 'user_1',
    gender: 'MALE',
    lookingFor: 'FEMALE',
    cityId: 'city_tashkent',
    region: 'Toshkent shahri',
    birthDate: new Date('2000-01-01'), // 24 yosh
    interestIds: ['int_it', 'int_coffee', 'int_travel'],
    blockedUserIds: new Set(['user_blocked']),
    excludedUserIds: new Set(['user_liked', 'user_matched']),
  };

  const candidates: CandidateScoringProfile[] = [
    {
      id: 'candidate_perfect',
      gender: 'FEMALE',
      birthDate: new Date('2001-05-10'), // 23 yosh (yaqin)
      cityId: 'city_tashkent', // Bir xil shahar (+40)
      region: 'Toshkent shahri',
      bio: 'Sayohat va qahva jonu dilim.', // Bio bor (+15)
      isVerified: true, // (+25)
      isPremium: true,
      isBlocked: false,
      isBanned: false,
      activeBoostUntil: new Date(Date.now() + 3600000), // Boost faol (+150)
      lastActiveAt: new Date(), // Yaqinda faol (+25)
      photosCount: 3,
      interestIds: ['int_it', 'int_coffee'], // 2 ta umumiy qiziqish (+24)
    },
    {
      id: 'candidate_regular',
      gender: 'FEMALE',
      birthDate: new Date('1995-01-01'), // 29 yosh
      cityId: 'city_samarkand',
      region: 'Samarqand viloyati',
      bio: null,
      isVerified: false,
      isPremium: false,
      isBlocked: false,
      isBanned: false,
      photosCount: 1,
      interestIds: ['int_art'],
    },
    {
      id: 'user_blocked', // Bloklangan nomzod
      gender: 'FEMALE',
      birthDate: new Date('2000-01-01'),
      isVerified: true,
      isPremium: false,
      isBlocked: false,
      isBanned: false,
      photosCount: 1,
      interestIds: [],
    },
    {
      id: 'candidate_wrong_gender', // Noto'g'ri jins
      gender: 'MALE',
      birthDate: new Date('2000-01-01'),
      isVerified: true,
      isPremium: false,
      isBlocked: false,
      isBanned: false,
      photosCount: 1,
      interestIds: [],
    },
  ];

  it('Hard filterlar bloklangan va notoʻgʻri jinsdagi nomzodlarni chiqarib tashlashi kerak', () => {
    expect(passesHardFilters(currentUser, candidates[0])).toBe(true);
    expect(passesHardFilters(currentUser, candidates[1])).toBe(true);
    expect(passesHardFilters(currentUser, candidates[2])).toBe(false); // Bloklangan
    expect(passesHardFilters(currentUser, candidates[3])).toBe(false); // Noto'g'ri jins
  });

  it('Eng yuqori ballga ega nomzod 1-oʻrinda saralanishi kerak', () => {
    const ranked = rankCandidates(currentUser, candidates);
    expect(ranked.length).toBe(2);
    expect(ranked[0].candidateId).toBe('candidate_perfect');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].breakdown.boost).toBe(150);
    expect(ranked[0].breakdown.cityMatch).toBe(40);
  });
});

// ==============================================================
// YAQIN PLATFORM - DETERMINISTIC RECOMMENDATION SCORING ALGORITHM
// ==============================================================

export interface CandidateScoringProfile {
  id: string;
  birthDate: Date | string;
  gender: 'MALE' | 'FEMALE';
  cityId?: string | null;
  region?: string | null;
  bio?: string | null;
  isVerified: boolean;
  isPremium: boolean;
  isBlocked: boolean;
  isBanned: boolean;
  activeBoostUntil?: Date | string | null;
  lastActiveAt?: Date | string | null;
  photosCount: number;
  interestIds: string[];
}

export interface UserPreferences {
  id: string;
  gender: 'MALE' | 'FEMALE';
  lookingFor: 'MALE' | 'FEMALE' | 'ALL';
  cityId?: string | null;
  region?: string | null;
  birthDate: Date | string;
  interestIds: string[];
  blockedUserIds: Set<string>;
  excludedUserIds: Set<string>; // liked, skipped, matched
}

export interface ScoredCandidate {
  candidateId: string;
  score: number;
  breakdown: {
    base: number;
    cityMatch: number;
    regionMatch: number;
    interestMatch: number;
    completeness: number;
    verification: number;
    recentActivity: number;
    boost: number;
    ageProximity: number;
  };
}

export const calculateAge = (birthDateInput: Date | string): number => {
  const birthDate = typeof birthDateInput === 'string' ? new Date(birthDateInput) : birthDateInput;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Nomzod profil foydalanuvchining qat'iy talablariga (hard filters) to'g'ri keladimi?
 */
export const passesHardFilters = (
  user: UserPreferences,
  candidate: CandidateScoringProfile
): boolean => {
  // 1. O'zining profili bo'lmasligi kerak
  if (candidate.id === user.id) return false;

  // 2. Bloklangan yoki ban qilingan bo'lmasligi kerak
  if (candidate.isBanned || candidate.isBlocked) return false;
  if (user.blockedUserIds.has(candidate.id)) return false;

  // 3. Allaqachon like, skip yoki match qilingan bo'lmasligi kerak
  if (user.excludedUserIds.has(candidate.id)) return false;

  // 4. Kamida 1 ta fotosurati bo'lishi shart
  if (candidate.photosCount < 1) return false;

  // 5. Jinsiy moslik (Gender Preference)
  if (user.lookingFor !== 'ALL' && candidate.gender !== user.lookingFor) {
    return false;
  }

  return true;
};

/**
 * Nomzod uchun deterministic moslik ballini hisoblash
 */
export const calculateCandidateScore = (
  user: UserPreferences,
  candidate: CandidateScoringProfile
): ScoredCandidate => {
  let totalScore = 100; // Asosiy baza balli

  const breakdown = {
    base: 100,
    cityMatch: 0,
    regionMatch: 0,
    interestMatch: 0,
    completeness: 0,
    verification: 0,
    recentActivity: 0,
    boost: 0,
    ageProximity: 0,
  };

  // 1. Shahar va Hudud mosligi (City, District & Region Match) — Eng ustuvor omil
  if (user.cityId && candidate.cityId && user.cityId === candidate.cityId) {
    breakdown.cityMatch = 120; // O'zining shahri/tumanidagi nomzodlarga eng katta ustuvorlik
    totalScore += 120;
  } else if (user.region && candidate.region && user.region === candidate.region) {
    breakdown.regionMatch = 60; // O'zining viloyatidagi nomzodlarga yuqori ustuvorlik
    totalScore += 60;
  }

  // 2. Umumiy qiziqishlar mosligi (Shared Interests)
  const userInterests = new Set(user.interestIds);
  let sharedCount = 0;
  for (const interestId of candidate.interestIds) {
    if (userInterests.has(interestId)) {
      sharedCount++;
    }
  }
  const interestScore = Math.min(sharedCount * 12, 60); // Har bir umumiy qiziqish uchun 12 ball (max 60)
  breakdown.interestMatch = interestScore;
  totalScore += interestScore;

  // 3. Yosh yaqinligi (Age Proximity)
  const userAge = calculateAge(user.birthDate);
  const candidateAge = calculateAge(candidate.birthDate);
  const ageDiff = Math.abs(userAge - candidateAge);
  if (ageDiff <= 2) {
    breakdown.ageProximity = 30;
    totalScore += 30;
  } else if (ageDiff <= 5) {
    breakdown.ageProximity = 20;
    totalScore += 20;
  } else if (ageDiff <= 8) {
    breakdown.ageProximity = 10;
    totalScore += 10;
  }

  // 4. Profil to'liqligi (Profile Completeness & Photos)
  let completenessScore = 0;
  if (candidate.bio && candidate.bio.trim().length > 10) {
    completenessScore += 15;
  }
  completenessScore += Math.min(candidate.photosCount * 5, 25); // Har bir rasm uchun +5 (max 25)
  breakdown.completeness = completenessScore;
  totalScore += completenessScore;

  // 5. Tasdiqlanganlik (Verified Badge)
  if (candidate.isVerified) {
    breakdown.verification = 25;
    totalScore += 25;
  }

  // 6. Oxirgi faollik (Recent Activity)
  if (candidate.lastActiveAt) {
    const lastActive = new Date(candidate.lastActiveAt).getTime();
    const hoursSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60);
    if (hoursSinceActive <= 3) {
      breakdown.recentActivity = 25;
      totalScore += 25;
    } else if (hoursSinceActive <= 24) {
      breakdown.recentActivity = 15;
      totalScore += 15;
    } else if (hoursSinceActive <= 72) {
      breakdown.recentActivity = 5;
      totalScore += 5;
    }
  }

  // 7. Profilni ko'tarish (Active Boost Multiplier)
  if (candidate.activeBoostUntil) {
    const boostExpiry = new Date(candidate.activeBoostUntil).getTime();
    if (boostExpiry > Date.now()) {
      breakdown.boost = 150; // Boost faol bo'lsa darhol +150 ball
      totalScore += 150;
    }
  }

  return {
    candidateId: candidate.id,
    score: totalScore,
    breakdown,
  };
};

/**
 * Nomzodlarni deterministic tartibda saralash
 */
export const rankCandidates = (
  user: UserPreferences,
  candidates: CandidateScoringProfile[]
): ScoredCandidate[] => {
  return candidates
    .filter((candidate) => passesHardFilters(user, candidate))
    .map((candidate) => calculateCandidateScore(user, candidate))
    .sort((a, b) => {
      // Eng yuqori ball oldinda
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Agar ballar teng bo'lsa, deterministik ID solishtirish
      return a.candidateId.localeCompare(b.candidateId);
    });
};

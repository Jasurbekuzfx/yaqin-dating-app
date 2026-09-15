import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Xavfsiz parol xeshlovchi yordamchi
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password + 'yaqin_salt_secure').digest('hex');
};

async function main() {
  console.log('🌱 Maʼlumotlar bazasini toʻldirish (Seeding) boshlandi...');

  // 1. Shaharlar (Cities of Uzbekistan)
  const citiesData = [
    { name: 'Toshkent', region: 'Toshkent shahri' },
    { name: 'Samarqand', region: 'Samarqand viloyati' },
    { name: 'Buxoro', region: 'Buxoro viloyati' },
    { name: 'Andijon', region: 'Andijon viloyati' },
    { name: 'Fargʻona', region: 'Fargʻona viloyati' },
    { name: 'Namangan', region: 'Namangan viloyati' },
    { name: 'Urganch', region: 'Xorazm viloyati' },
    { name: 'Nukus', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Qarshi', region: 'Qashqadaryo viloyati' },
    { name: 'Termiz', region: 'Surxondaryo viloyati' },
    { name: 'Navoiy', region: 'Navoiy viloyati' },
    { name: 'Jizzax', region: 'Jizzax viloyati' },
    { name: 'Guliston', region: 'Sirdaryo viloyati' },
    { name: 'Chirchiq', region: 'Toshkent viloyati' },
    { name: 'Olmaliq', region: 'Toshkent viloyati' },
  ];

  const createdCities: Record<string, string> = {};
  for (const c of citiesData) {
    const city = await prisma.city.create({
      data: c,
    });
    createdCities[c.name] = city.id;
  }
  console.log(`✅ ${citiesData.length} ta shahar yaratildi.`);

  // 2. Qiziqishlar (Interests)
  const interestsData = [
    { name: 'Sayohat', category: 'Hayot tarzi', icon: '✈️' },
    { name: 'Kitob mutolaasi', category: 'Madaniyat', icon: '📚' },
    { name: 'Sport & Fitnes', category: 'Salomatlik', icon: '🏃‍♂️' },
    { name: 'Qahva & Suhbat', category: 'Hayot tarzi', icon: '☕' },
    { name: 'IT & Dasturlash', category: 'Karyera', icon: '💻' },
    { name: 'Fotografiya', category: 'Sanʼat', icon: '📸' },
    { name: 'Kulinariya', category: 'Hayot tarzi', icon: '🍳' },
    { name: 'Kino va Seriallar', category: 'Koʻngilochar', icon: '🎬' },
    { name: 'Musiqa', category: 'Sanʼat', icon: '🎵' },
    { name: 'Togʻ sayrlari', category: 'Faol dam', icon: '🏔️' },
    { name: 'Avtomobillar', category: 'Qiziqish', icon: '🚗' },
    { name: 'Startap va Biznes', category: 'Karyera', icon: '📈' },
    { name: 'Psixologiya', category: 'Rivojlanish', icon: '🧠' },
    { name: 'Tennis', category: 'Sport', icon: '🎾' },
    { name: 'Shaxmat', category: 'Intellekt', icon: '♟️' },
  ];

  const createdInterests: Record<string, string> = {};
  for (const item of interestsData) {
    const interest = await prisma.interest.create({
      data: item,
    });
    createdInterests[item.name] = interest.id;
  }
  console.log(`✅ ${interestsData.length} ta qiziqish yaratildi.`);

  // 3. SuperAdmin Foydalanuvchi
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@yaqin.uz';
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'SuperSecureAdminPassword123!';
  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      name: 'Bosh Administrator',
      passwordHash: hashPassword(adminPass),
      role: 'SUPERADMIN',
    },
  });
  console.log(`✅ SuperAdmin yaratildi: ${adminEmail}`);

  // 4. Test Foydalanuvchilar (faqat development / test muhitida)
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const testUsers = [
      {
        telegramId: '100000001',
        username: 'madina_tash',
        firstName: 'Madina',
        lastName: 'Karimova',
        birthDate: new Date('2002-04-15'), // 22 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Toshkent'],
        bio: 'Arxitektura va dizayn bilan shugʻullanaman. Boʻsh vaqtimda qahva ichib kitob oʻqishni va sayohat qilishni yaxshi koʻraman.',
        isVerified: true,
        isPremium: true,
        photos: [
          { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', isPrimary: false, sortOrder: 1 },
        ],
        interests: ['Qahva & Suhbat', 'Fotografiya', 'Sayohat', 'Kitob mutolaasi'],
      },
      {
        telegramId: '100000002',
        username: 'jasur_sam',
        firstName: 'Jasur',
        lastName: 'Alimov',
        birthDate: new Date('1999-08-20'), // 25 yosh
        gender: 'MALE',
        lookingFor: 'FEMALE',
        cityId: createdCities['Toshkent'],
        bio: 'IT sohasida dasturchiman. Togʻlarga chiqish va sogʻlom turmush tarzini yoqtiraman. Samimiy insonlar bilan tanishishdan mamnunman.',
        isVerified: true,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', isPrimary: false, sortOrder: 1 },
        ],
        interests: ['IT & Dasturlash', 'Togʻ sayrlari', 'Sport & Fitnes', 'Startap va Biznes'],
      },
      {
        telegramId: '100000003',
        username: 'nilufar_bux',
        firstName: 'Nilufar',
        lastName: 'Saidova',
        birthDate: new Date('2001-11-10'), // 23 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Samarqand'],
        bio: 'Xorijiy tillar oʻqituvchisiman. Madaniyat, sanʼat va qadimgi shaharlar tarixiga qiziqaman.',
        isVerified: false,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Kitob mutolaasi', 'Sayohat', 'Psixologiya', 'Musiqa'],
      },
      {
        telegramId: '100000004',
        username: 'sardor_dev',
        firstName: 'Sardor',
        lastName: 'Rahmonov',
        birthDate: new Date('1998-03-12'), // 26 yosh
        gender: 'MALE',
        lookingFor: 'FEMALE',
        cityId: createdCities['Toshkent'],
        bio: 'Tadbirkor. Tennis oʻynash va yangi loyihalar boshlash hayotim mazmuni.',
        isVerified: true,
        isPremium: true,
        photos: [
          { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Tennis', 'Startap va Biznes', 'Avtomobillar'],
      },
      {
        telegramId: '100000005',
        username: 'dildora_and',
        firstName: 'Dildora',
        lastName: 'Yusupova',
        birthDate: new Date('2003-07-05'), // 21 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Toshkent'],
        bio: 'Shifokor-talabaman. Kulinariya va pozitiv insonlar bilan suhbatlashish kayfiyatimni koʻtaradi.',
        isVerified: true,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Kulinariya', 'Qahva & Suhbat', 'Psixologiya'],
      },
      {
        telegramId: '100000006',
        username: 'bekzod_farg',
        firstName: 'Bekzod',
        lastName: 'Tursunov',
        birthDate: new Date('2000-01-25'), // 24 yosh
        gender: 'MALE',
        lookingFor: 'FEMALE',
        cityId: createdCities['Fargʻona'],
        bio: 'Fotograf va videograf. Dunyoni kadrlar orqali koʻrishni yaxshi koʻraman.',
        isVerified: false,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Fotografiya', 'Kino va Seriallar', 'Musiqa'],
      },
    ];

    for (const u of testUsers) {
      const user = await prisma.user.create({
        data: {
          telegramId: u.telegramId,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          birthDate: u.birthDate,
          gender: u.gender,
          lookingFor: u.lookingFor,
          cityId: u.cityId,
          bio: u.bio,
          isVerified: u.isVerified,
          isPremium: u.isPremium,
          photos: {
            create: u.photos,
          },
          userInterests: {
            create: u.interests.map((name) => ({
              interestId: createdInterests[name],
            })),
          },
        },
      });
      console.log(`👤 Test foydalanuvchi: ${user.firstName} (${user.gender})`);
    }

    console.log('✅ Barcha test profillar yaratildi.');
  }

  console.log('✨ Seeding muvaffaqiyatli yakunlandi!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding jarayonida xatolik:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

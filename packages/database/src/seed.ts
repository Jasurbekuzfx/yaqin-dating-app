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

  // Oldingi ma'lumotlarni xavfsiz tozalash
  await prisma.videoComment.deleteMany();
  await prisma.videoLike.deleteMany();
  await prisma.videoView.deleteMany();
  await prisma.video.deleteMany();
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.profilePhoto.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.superLikeTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.city.deleteMany();
  await prisma.adminUser.deleteMany();

  // 1. O'zbekistonning barcha 14 ta hududi, shaharlari va tumanlari
  const citiesData = [
    // Toshkent shahri tumanlari
    { name: 'Toshkent (Yunusobod)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Chilonzor)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Mirzo Ulugʻbek)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Yakkasaroy)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Mirobod)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Shayxontohur)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Olmazor)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Uchtepa)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Sergeli)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Yashnobod)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Bektemir)', region: 'Toshkent shahri' },
    { name: 'Toshkent (Yangihayot)', region: 'Toshkent shahri' },

    // Toshkent viloyati
    { name: 'Chirchiq', region: 'Toshkent viloyati' },
    { name: 'Olmaliq', region: 'Toshkent viloyati' },
    { name: 'Angren', region: 'Toshkent viloyati' },
    { name: 'Bekobod', region: 'Toshkent viloyati' },
    { name: 'Nurafshon', region: 'Toshkent viloyati' },
    { name: 'Yangiyoʻl', region: 'Toshkent viloyati' },
    { name: 'Boʻstonliq (Chorvoq/Gʻazalkent)', region: 'Toshkent viloyati' },
    { name: 'Zangiota', region: 'Toshkent viloyati' },
    { name: 'Qibray', region: 'Toshkent viloyati' },
    { name: 'Parkent', region: 'Toshkent viloyati' },
    { name: 'Toshkent tumani (Keles)', region: 'Toshkent viloyati' },
    { name: 'Oqqoʻrgʻon', region: 'Toshkent viloyati' },
    { name: 'Chinoz', region: 'Toshkent viloyati' },
    { name: 'Yuqori Chirchiq', region: 'Toshkent viloyati' },
    { name: 'Oʻrta Chirchiq', region: 'Toshkent viloyati' },
    { name: 'Quyi Chirchiq', region: 'Toshkent viloyati' },
    { name: 'Piskent', region: 'Toshkent viloyati' },
    { name: 'Boʻka', region: 'Toshkent viloyati' },

    // Samarqand viloyati
    { name: 'Samarqand shahri', region: 'Samarqand viloyati' },
    { name: 'Kattaqoʻrgʻon shahri', region: 'Samarqand viloyati' },
    { name: 'Urgut', region: 'Samarqand viloyati' },
    { name: 'Bulungʻur', region: 'Samarqand viloyati' },
    { name: 'Jomboy', region: 'Samarqand viloyati' },
    { name: 'Ishtixon', region: 'Samarqand viloyati' },
    { name: 'Oqdaryo (Loyish)', region: 'Samarqand viloyati' },
    { name: 'Pastdargʻom (Juma)', region: 'Samarqand viloyati' },
    { name: 'Payariq (Chelak)', region: 'Samarqand viloyati' },
    { name: 'Samarqand tumani', region: 'Samarqand viloyati' },
    { name: 'Toyloq', region: 'Samarqand viloyati' },
    { name: 'Narpay (Oqtosh)', region: 'Samarqand viloyati' },
    { name: 'Paxtachi (Ziyovuddin)', region: 'Samarqand viloyati' },
    { name: 'Qoʻshrabot', region: 'Samarqand viloyati' },
    { name: 'Nurobod', region: 'Samarqand viloyati' },

    // Andijon viloyati
    { name: 'Andijon shahri', region: 'Andijon viloyati' },
    { name: 'Xonobod shahri', region: 'Andijon viloyati' },
    { name: 'Asaka', region: 'Andijon viloyati' },
    { name: 'Shahrixon', region: 'Andijon viloyati' },
    { name: 'Qoʻrgʻontepa', region: 'Andijon viloyati' },
    { name: 'Oltinkoʻl', region: 'Andijon viloyati' },
    { name: 'Baliqchi', region: 'Andijon viloyati' },
    { name: 'Boʻston (Boʻz)', region: 'Andijon viloyati' },
    { name: 'Buloqboshi', region: 'Andijon viloyati' },
    { name: 'Izboskan (Poytugʻ)', region: 'Andijon viloyati' },
    { name: 'Jalaquduq (Oxunboboyev)', region: 'Andijon viloyati' },
    { name: 'Marhamat', region: 'Andijon viloyati' },
    { name: 'Paxtaobod', region: 'Andijon viloyati' },
    { name: 'Ulugʻnor (Oqoltin)', region: 'Andijon viloyati' },
    { name: 'Xoʻjaobod', region: 'Andijon viloyati' },

    // Fargʻona viloyati
    { name: 'Fargʻona shahri', region: 'Fargʻona viloyati' },
    { name: 'Qoʻqon shahri', region: 'Fargʻona viloyati' },
    { name: 'Margʻilon shahri', region: 'Fargʻona viloyati' },
    { name: 'Quvasoy shahri', region: 'Fargʻona viloyati' },
    { name: 'Quva', region: 'Fargʻona viloyati' },
    { name: 'Oltiariq', region: 'Fargʻona viloyati' },
    { name: 'Rishton', region: 'Fargʻona viloyati' },
    { name: 'Beshariq', region: 'Fargʻona viloyati' },
    { name: 'Bogʻdod', region: 'Fargʻona viloyati' },
    { name: 'Buvayda (Ibrat)', region: 'Fargʻona viloyati' },
    { name: 'Dangʻara', region: 'Fargʻona viloyati' },
    { name: 'Fargʻona tumani (Vodil)', region: 'Fargʻona viloyati' },
    { name: 'Furqat (Navbahor)', region: 'Fargʻona viloyati' },
    { name: 'Qoʻshtepa (Langar)', region: 'Fargʻona viloyati' },
    { name: 'Soʻx (Ravon)', region: 'Fargʻona viloyati' },
    { name: 'Toshloq', region: 'Fargʻona viloyati' },
    { name: 'Uchkoʻprik', region: 'Fargʻona viloyati' },
    { name: 'Yozyovon', region: 'Fargʻona viloyati' },

    // Namangan viloyati
    { name: 'Namangan shahri', region: 'Namangan viloyati' },
    { name: 'Chust', region: 'Namangan viloyati' },
    { name: 'Kosonsoy', region: 'Namangan viloyati' },
    { name: 'Pop', region: 'Namangan viloyati' },
    { name: 'Toʻraqoʻrgʻon', region: 'Namangan viloyati' },
    { name: 'Uchqoʻrgʻon', region: 'Namangan viloyati' },
    { name: 'Chortoq', region: 'Namangan viloyati' },
    { name: 'Norin (Haqqulobod)', region: 'Namangan viloyati' },
    { name: 'Mingbuloq (Jomashoʻy)', region: 'Namangan viloyati' },
    { name: 'Uychi', region: 'Namangan viloyati' },
    { name: 'Yangiqoʻrgʻon', region: 'Namangan viloyati' },
    { name: 'Davlatobod tumani', region: 'Namangan viloyati' },
    { name: 'Yangi Namangan tumani', region: 'Namangan viloyati' },

    // Buxoro viloyati
    { name: 'Buxoro shahri', region: 'Buxoro viloyati' },
    { name: 'Kogon shahri', region: 'Buxoro viloyati' },
    { name: 'Gʻijduvon', region: 'Buxoro viloyati' },
    { name: 'Vobkent', region: 'Buxoro viloyati' },
    { name: 'Jondor', region: 'Buxoro viloyati' },
    { name: 'Kogon tumani', region: 'Buxoro viloyati' },
    { name: 'Olot', region: 'Buxoro viloyati' },
    { name: 'Peshku (Yangibozor)', region: 'Buxoro viloyati' },
    { name: 'Qorakoʻl', region: 'Buxoro viloyati' },
    { name: 'Qorovulbozor', region: 'Buxoro viloyati' },
    { name: 'Romitan', region: 'Buxoro viloyati' },
    { name: 'Shofirkon', region: 'Buxoro viloyati' },
    { name: 'Buxoro tumani (Galaosiyo)', region: 'Buxoro viloyati' },

    // Xorazm viloyati
    { name: 'Urganch shahri', region: 'Xorazm viloyati' },
    { name: 'Xiva shahri', region: 'Xorazm viloyati' },
    { name: 'Xonka', region: 'Xorazm viloyati' },
    { name: 'Bogʻot', region: 'Xorazm viloyati' },
    { name: 'Gurlan', region: 'Xorazm viloyati' },
    { name: 'Qoʻshkoʻpir', region: 'Xorazm viloyati' },
    { name: 'Shovot', region: 'Xorazm viloyati' },
    { name: 'Tuproqqalʼa (Pitnak)', region: 'Xorazm viloyati' },
    { name: 'Xazorasp', region: 'Xorazm viloyati' },
    { name: 'Yangiariq', region: 'Xorazm viloyati' },
    { name: 'Yangibozor', region: 'Xorazm viloyati' },

    // Qashqadaryo viloyati
    { name: 'Qarshi shahri', region: 'Qashqadaryo viloyati' },
    { name: 'Shahrisabz shahri', region: 'Qashqadaryo viloyati' },
    { name: 'Kitob', region: 'Qashqadaryo viloyati' },
    { name: 'Koson', region: 'Qashqadaryo viloyati' },
    { name: 'Gʻuzor', region: 'Qashqadaryo viloyati' },
    { name: 'Qamashi', region: 'Qashqadaryo viloyati' },
    { name: 'Kasbi (Mugʻlon)', region: 'Qashqadaryo viloyati' },
    { name: 'Mirishkor (Yangi Mirishkor)', region: 'Qashqadaryo viloyati' },
    { name: 'Muborak', region: 'Qashqadaryo viloyati' },
    { name: 'Nishon (Yangi Nishon)', region: 'Qashqadaryo viloyati' },
    { name: 'Chiroqchi', region: 'Qashqadaryo viloyati' },
    { name: 'Koʻkdala (Yettitom)', region: 'Qashqadaryo viloyati' },
    { name: 'Dehqonobod (Karashina)', region: 'Qashqadaryo viloyati' },
    { name: 'Yakkabogʻ', region: 'Qashqadaryo viloyati' },

    // Surxondaryo viloyati
    { name: 'Termiz shahri', region: 'Surxondaryo viloyati' },
    { name: 'Denov', region: 'Surxondaryo viloyati' },
    { name: 'Sherobod', region: 'Surxondaryo viloyati' },
    { name: 'Boysun', region: 'Surxondaryo viloyati' },
    { name: 'Jarqoʻrgʻon', region: 'Surxondaryo viloyati' },
    { name: 'Qumqoʻrgʻon', region: 'Surxondaryo viloyati' },
    { name: 'Shoʻrchi', region: 'Surxondaryo viloyati' },
    { name: 'Sariosiyo', region: 'Surxondaryo viloyati' },
    { name: 'Uzun', region: 'Surxondaryo viloyati' },
    { name: 'Oltinsoy (Qarluq)', region: 'Surxondaryo viloyati' },
    { name: 'Angor', region: 'Surxondaryo viloyati' },
    { name: 'Bandixon', region: 'Surxondaryo viloyati' },
    { name: 'Muzrabot (Xalqobod)', region: 'Surxondaryo viloyati' },
    { name: 'Qiziriq (Sariq)', region: 'Surxondaryo viloyati' },
    { name: 'Termiz tumani (Uchqizil)', region: 'Surxondaryo viloyati' },

    // Jizzax viloyati
    { name: 'Jizzax shahri', region: 'Jizzax viloyati' },
    { name: 'Zomin', region: 'Jizzax viloyati' },
    { name: 'Gʻallaorol', region: 'Jizzax viloyati' },
    { name: 'Baxmal (Usmat)', region: 'Jizzax viloyati' },
    { name: 'Doʻstlik', region: 'Jizzax viloyati' },
    { name: 'Zarbdor', region: 'Jizzax viloyati' },
    { name: 'Zafarobod', region: 'Jizzax viloyati' },
    { name: 'Mirzachoʻl (Gagarin)', region: 'Jizzax viloyati' },
    { name: 'Paxtakor', region: 'Jizzax viloyati' },
    { name: 'Forish (Yangiqishloq)', region: 'Jizzax viloyati' },
    { name: 'Sharof Rashidov tumani (Uchtepa)', region: 'Jizzax viloyati' },
    { name: 'Arnasoy (Gʻoliblar)', region: 'Jizzax viloyati' },
    { name: 'Yangiobod (Balandchaqir)', region: 'Jizzax viloyati' },

    // Sirdaryo viloyati
    { name: 'Guliston shahri', region: 'Sirdaryo viloyati' },
    { name: 'Shirin shahri', region: 'Sirdaryo viloyati' },
    { name: 'Yangiyer shahri', region: 'Sirdaryo viloyati' },
    { name: 'Boyovut', region: 'Sirdaryo viloyati' },
    { name: 'Guliston tumani (Dehqonobod)', region: 'Sirdaryo viloyati' },
    { name: 'Mirzaobod (Navroʻz)', region: 'Sirdaryo viloyati' },
    { name: 'Oqoltin (Sardoba)', region: 'Sirdaryo viloyati' },
    { name: 'Sayxunobod (Sayxun)', region: 'Sirdaryo viloyati' },
    { name: 'Sardoba (Paxtaobod)', region: 'Sirdaryo viloyati' },
    { name: 'Sirdaryo tumani', region: 'Sirdaryo viloyati' },
    { name: 'Xovos', region: 'Sirdaryo viloyati' },

    // Navoiy viloyati
    { name: 'Navoiy shahri', region: 'Navoiy viloyati' },
    { name: 'Zarafshon shahri', region: 'Navoiy viloyati' },
    { name: 'Qiziltepa', region: 'Navoiy viloyati' },
    { name: 'Karmana', region: 'Navoiy viloyati' },
    { name: 'Konimex', region: 'Navoiy viloyati' },
    { name: 'Navbahor (Beshrabot)', region: 'Navoiy viloyati' },
    { name: 'Nurota', region: 'Navoiy viloyati' },
    { name: 'Tomdi (Tomdibuloq)', region: 'Navoiy viloyati' },
    { name: 'Uchquduq', region: 'Navoiy viloyati' },
    { name: 'Xatirchi (Yangirabot)', region: 'Navoiy viloyati' },

    // Qoraqalpogʻiston Respublikasi
    { name: 'Nukus shahri', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Beruniy', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Toʻrtkoʻl', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Xoʻjayli', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Amudaryo (Mangʻit)', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Chimboy', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Ellikqalʼa (Boʻston)', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Kegeyli', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Moʻynoq', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Nukus tumani (Oqmangʻit)', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Qanlikoʻl (Leninobod)', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Qoʻngʻirot', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Qoraoʻzak', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Shumanay', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Taxtakoʻpir', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Taxiatosh shahri', region: 'Qoraqalpogʻiston Respublikasi' },
    { name: 'Boʻzatov', region: 'Qoraqalpogʻiston Respublikasi' },
  ];

  const createdCities: Record<string, string> = {};
  for (const c of citiesData) {
    const city = await prisma.city.create({
      data: c,
    });
    createdCities[c.name] = city.id;
  }
  console.log(`✅ ${citiesData.length} ta shahar va tuman yaratildi.`);

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
        cityId: createdCities['Toshkent (Yunusobod)'],
        bio: 'Arxitektura va dizayn bilan shugʻullanaman. Boʻsh vaqtimda qahva ichib kitob oʻqishni va sayohat qilishni yaxshi koʻraman. ☕️✨',
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
        cityId: createdCities['Toshkent (Chilonzor)'],
        bio: 'IT sohasida dasturchiman. Togʻlarga chiqish va sogʻlom turmush tarzini yoqtiraman. Samimiy insonlar bilan tanishishdan mamnunman. 🏔️💻',
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
        username: 'nilufar_sam',
        firstName: 'Nilufar',
        lastName: 'Saidova',
        birthDate: new Date('2001-11-10'), // 23 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Samarqand shahri'],
        bio: 'Xorijiy tillar oʻqituvchisiman. Madaniyat, sanʼat va qadimgi shaharlar tarixiga qiziqaman. 🏛️📖',
        isVerified: true,
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
        cityId: createdCities['Toshkent (Mirzo Ulugʻbek)'],
        bio: 'Tadbirkor. Tennis oʻynash va yangi loyihalar boshlash hayotim mazmuni. 🎾🚗',
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
        cityId: createdCities['Andijon shahri'],
        bio: 'Shifokor-talabaman. Kulinariya va pozitiv insonlar bilan suhbatlashish kayfiyatimni koʻtaradi. 🍳🩺',
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
        cityId: createdCities['Fargʻona shahri'],
        bio: 'Fotograf va videograf. Dunyoni kadrlar orqali koʻrishni yaxshi koʻraman. 📸🎬',
        isVerified: false,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Fotografiya', 'Kino va Seriallar', 'Musiqa'],
      },
      {
        telegramId: '100000007',
        username: 'shahlo_bux',
        firstName: 'Shahlo',
        lastName: 'Ergasheva',
        birthDate: new Date('2002-09-18'), // 22 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Buxoro shahri'],
        bio: 'Sharqona sanʼat va dizayn shaydosiman. Samimiyat va hurmat eng muhim qadriyat! 🌸',
        isVerified: true,
        isPremium: true,
        photos: [
          { url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Fotografiya', 'Sayohat', 'Kulinariya'],
      },
      {
        telegramId: '100000008',
        username: 'nodira_nam',
        firstName: 'Nodira',
        lastName: 'Mansurova',
        birthDate: new Date('2001-03-30'), // 23 yosh
        gender: 'FEMALE',
        lookingFor: 'MALE',
        cityId: createdCities['Namangan shahri'],
        bio: 'Gullar, tabiat va musiqa. Yangi doʻstlar va yaqin insonlar izlayapman. 🌷🎵',
        isVerified: true,
        isPremium: false,
        photos: [
          { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', isPrimary: true, sortOrder: 0 },
        ],
        interests: ['Musiqa', 'Kitob mutolaasi', 'Qahva & Suhbat'],
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

    // 5. Test Reels Videolar
    const usersWithPhotos = await prisma.user.findMany({
      take: 4,
      include: { photos: true },
    });

    const sampleVideos = [
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-smiling-at-the-camera-42845-large.mp4',
        caption: 'Toshkent boʻylab kechki sayr 🌆✨ Yangi insonlar bilan tanishishdan xursandman!',
        duration: 14.5,
      },
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-coffee-shop-smiling-and-drinking-coffee-42861-large.mp4',
        caption: 'Eng sevimli qahvaxonamda ☕️ Qiziqarli suhbatlarga doim ochiqman :)',
        duration: 12.0,
      },
      {
        url: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-42846-large.mp4',
        caption: 'Togʻlarga sayohat qilishni yaxshi koʻradiganlar bormi? 🏔️',
        duration: 15.0,
      },
    ];

    for (let i = 0; i < sampleVideos.length; i++) {
      const u = usersWithPhotos[i % usersWithPhotos.length];
      if (u) {
        await prisma.video.create({
          data: {
            userId: u.id,
            url: sampleVideos[i].url,
            thumbnailUrl: u.photos[0]?.url,
            caption: sampleVideos[i].caption,
            duration: sampleVideos[i].duration,
            status: 'PUBLISHED',
            likeCount: 12 + i * 8,
            commentCount: 3 + i * 2,
            viewCount: 140 + i * 65,
          },
        });
      }
    }
    console.log('✅ Test Reels videolari yaratildi.');
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

# Yaqin — Telegram Dating Platformasi 💫

> *"Siz izlagan inson — balki shu yerda."*

O‘zbekiston bozori uchun mo‘ljallangan, Telegram Mini App asosidagi zamonaviy, xavfsiz va to‘liq ishlaydigan tanishuv platformasi.

---

## 🚀 Texnologiyalar Staki

- **Monorepo**: npm workspaces (`apps/*`, `packages/*`)
- **Frontend (Telegram Mini App)**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query, Telegram Mini Apps SDK, Lucide Icons.
- **Backend API**: Node.js, TypeScript, Express.js, Socket.IO (real-time chat), Multer, Sharp (EXIF tozalash va WebP kompressiya), Zod, JWT.
- **Database & ORM**: PostgreSQL / SQLite (development uchun), Prisma ORM (18 ta to'liq model, munosabatlar va indekslar bilan).
- **Telegram Bot**: grammY framework (`/start`, `/help`, `/profile`, `/premium`, `/settings`, real-time bildirishnomalar servisi).
- **Admin Panel**: React 19, Vite, Tailwind CSS, TanStack Query (Dashboard metrikalari, foydalanuvchilar boshqaruvi, shikoyatlar, verifikatsiya, to'lovlar auditi).
- **Docker**: `docker-compose.yml` (PostgreSQL, API, Web, Bot, Admin).

---

## 📁 Monorepo Strukturasi

```
tanishuv-chat/
├── package.json              # Monorepo root konfiguratsiyasi
├── tsconfig.base.json        # Asosiy TypeScript sozlamalari
├── docker-compose.yml        # Docker konteynerlar
├── .env.example              # Namunaviy muhit o'zgaruvchilari
├── packages/
│   ├── database/             # Prisma schema, migrations, seed ma'lumotlari
│   │   ├── prisma/schema.prisma
│   │   ├── src/index.ts      # Prisma Client singleton
│   │   └── src/seed.ts       # O'zbekiston shaharlari, qiziqishlar, test profillar
│   └── shared/               # Umumiy turlar, Zod schemalar, i18n, scoring formulasi
│       ├── src/types/        # User, Like, Match, Message, Payment turlari
│       ├── src/schemas/      # Zod validation schemalari
│       ├── src/scoring/      # Deterministic recommendation scoring
│       └── src/i18n/         # O'zbekcha (asosiy), Ruscha, Inglizcha lug'atlar
└── apps/
    ├── api/                  # Express.js REST API + Socket.IO server
    ├── bot/                  # grammY Telegram Bot
    ├── web/                  # Telegram Mini App (React + Vite + Tailwind + Framer Motion)
    └── admin/                # Admin Web Dashboard (React + Vite)
```

---

## ✨ Asosiy Funksiyalar va Imkoniyatlar

1. **Telegram Kriptografik Autentifikatsiyasi (HMAC-SHA256)**:
   - Telegram `initData` bot tokeni asosidagi secret key orqali xavfsiz tekshiriladi.
   - 24 soatdan eski yoki buzilgan ma'lumotlar qat'iy rad etiladi.
2. **18+ Yosh Cheklovi va Onboarding**:
   - 7 bosqichli qulay onboarding (18+ tasdiqlash, jins, qidiruv, tug'ilgan sana, shahar, bio, qiziqishlar, fotosuratlar).
   - 18 yoshdan kichik foydalanuvchilar qat'iy to'xtatiladi.
3. **Deterministic Recommendation Engine**:
   - Random tavsiya yo'q! Ballar: Jinsiy moslik (Hard filter), Shahar/Viloyat mosligi, Umumiy qiziqishlar soni, Yosh yaqinligi, Profil to'liqligi, Tasdiqlanganlik (Verified badge), Yaqindagi faollik, Profilni ko'tarish (Boost).
4. **Tinder-Style Swipe & Action Tugmalari**:
   - Framer Motion orqali silliq surish (O'ngga - Like, Chapga - Skip, Yuqoriga - Super Like).
   - Fotosuratlar karuseli (Instagram stories-style bar indicator).
5. **O'zaro Yoqtirish va Match Celebration**:
   - Ikki tomonlama Like bosilganda darhol `Match` hosil bo'ladi, bayramona konfetti animatsiyasi va ikkala foydalanuvchiga Telegram bot orqali bildirishnoma boradi.
6. **Real-Time Chat (Socket.IO + REST)**:
   - Faqat o'zaro Match bo'lganlar chat qila oladi.
   - "Yozmoqda..." (Typing indicator), xabar o'qildi statuslari, cursor pagination.
7. **Monetizatsiya va To'lovlar**:
   - Yaqin Premium (7 kun, 1 oy, 3 oy, 1 yil).
   - Telegram Stars va so'm to'lovlari arxitekturasi.
   - Profilni 1-o'ringa ko'tarish (Boost 1, 3, 24 soat) va Super Likelar.
   - Idempotent to'lov tekshiruvi.
8. **Xavfsizlik va Moderatsiya**:
   - Istalgan profilni bloklash (avtomatik Discover va Chatdan olib tashlanadi).
   - Shikoyat (Report) yuborish.
   - Profilni tasdiqlash (Verification selfie arizasi).
9. **Admin Web Dashboard**:
   - Real-vaqtdagi statistika (DAU, yangi foydalanuvchilar, tushum, matchlar).
   - Foydalanuvchilarni qidirish, ban/unban qilish, qo'lda verifikatsiya berish.
   - Shikoyatlar va arizalar navbati.

---

## 🛠️ O'rnatish va Ishga Tushirish

### Talablar
- Node.js >= 20
- npm >= 10

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. Ma'lumotlar bazasini sozlash va to'ldirish
```bash
npm run db:push
npm run db:seed
```

### 3. Loyihani ishga tushirish (Development)
```bash
# Backend API (Port 4000)
npm run dev:api

# Frontend Telegram Mini App (Port 5173)
npm run dev:web

# Telegram Bot
npm run dev:bot

# Admin Dashboard (Port 5174)
npm run dev:admin
```

---

## 🧪 Testlarni Ishga Tushirish

```bash
npm run test
```

---

## 🐳 Docker orqali Ishga Tushirish

```bash
docker compose up -d --build
```

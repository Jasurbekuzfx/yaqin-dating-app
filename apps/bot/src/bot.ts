import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';
import { prisma } from '@yaqin/database';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const appUrl = process.env.APP_URL || 'http://localhost:5173';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
const isProduction = process.env.NODE_ENV === 'production';

// Admin Telegram ID lari (.env dan)
const adminTelegramIds = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

if (!token || token.startsWith('dev_') || token === 'fake_token') {
  if (isProduction) {
    console.error('❌ [CRITICAL PRODUCTION ERROR]: Haqiqiy TELEGRAM_BOT_TOKEN oʻrnatilmagan!');
  } else {
    console.log('⚠️ [Development]: Mock bot rejimida ishlayapti.');
  }
}

export const bot = new Bot(token || 'dummy_token');

// /start komandasi
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('💫 Boshlash', appUrl);

  const welcomeText =
    `🌟 <b>Yaqin — yangi insonlar bilan tanishing.</b>\n\n` +
    `<i>“Siz izlagan inson — balki shu yerda.”</i>\n\n` +
    `Oʻzbekistondagi eng zamonaviy, qulay va xavfsiz tanishuv platformasiga xush kelibsiz!\n\n` +
    `Quyidagi tugmani bosib darhol boshlang 👇`;

  await ctx.reply(welcomeText, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// /admin komandasi (Faqat vakolatli Adminlar uchun)
bot.command('admin', async (ctx) => {
  const senderId = String(ctx.from?.id);

  const isSuperAdmin = adminTelegramIds.includes(senderId);

  // Bazadan ham admin tekshiruvini amalga oshirish
  const dbUser = await prisma.user.findUnique({
    where: { telegramId: senderId },
  });

  if (!isSuperAdmin && (!dbUser || !adminTelegramIds.includes(dbUser.telegramId))) {
    // Agar admin bo'lmasa, o'zining Telegram ID sini ko'rsatamiz
    await ctx.reply(
      `🔒 <b>Admin ruxsati mavjud emas.</b>\n\nSizning Telegram ID: <code>${senderId}</code>\nUshbu ID ni <code>.env</code> dagi <b>ADMIN_TELEGRAM_IDS</b> qatoriga qoʻshing.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Tezkor statistika
  const [totalUsers, totalMatches, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.payment.aggregate({
      where: { status: 'PAID', currency: 'UZS' },
      _sum: { amount: true },
    }),
  ]);

  const keyboard = new InlineKeyboard()
    .webApp('📊 Admin Panelni Ochish', adminUrl)
    .row()
    .webApp('💫 Mini App', appUrl);

  const adminMsg =
    `👑 <b>Yaqin Admin Boshqaruv Markazi</b>\n\n` +
    `👤 <b>Jami foydalanuvchilar:</b> ${totalUsers} ta\n` +
    `💫 <b>Hosillangan Matchlar:</b> ${totalMatches} ta\n` +
    `💰 <b>Tushum:</b> ${(totalRevenue._sum.amount || 0).toLocaleString()} soʻm\n\n` +
    `Toʻliq boshqarish uchun quyidagi tugmani bosing 👇`;

  await ctx.reply(adminMsg, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// /help komandasi
bot.command('help', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('💫 Mini Appni ochish', appUrl);

  const helpText =
    `ℹ️ <b>Yaqin platformasi boʻyicha maʼlumot:</b>\n\n` +
    `• <b>18+ Talabi:</b> Platformadan faqat 18 yoshga toʻlgan foydalanuvchilar foydalanishi mumkin.\n` +
    `• <b>Xavfsizlik:</b> Soxta profillar va spamdan himoyalangan. Har bir profilni bloklash yoki shikoyat qilish mumkin.\n` +
    `• <b>Match tizimi:</b> Faqat bir-biringizni yoqtirganingizda chat ochiladi.\n` +
    `• <b>Premium:</b> Kim sizni yoqtirganini koʻrish, cheksiz Likelar va profilni koʻtarish imkoniyati.\n\n` +
    `Savollaringiz boʻlsa, @yaqin_support ga murojaat qiling.`;

  await ctx.reply(helpText, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
});

// /profile komandasi
bot.command('profile', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('👤 Mening Profilim', `${appUrl}/profile`);
  await ctx.reply('Profilingizni koʻrish va tahrirlash uchun quyidagi tugmani bosing:', {
    reply_markup: keyboard,
  });
});

// /premium komandasi
bot.command('premium', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('⭐ Premium Obuna', `${appUrl}/premium`);
  await ctx.reply('Yaqin Premium imtiyozlari va tariflari bilan tanishish uchun quyidagi tugmani bosing:', {
    reply_markup: keyboard,
  });
});

// /settings komandasi
bot.command('settings', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('⚙️ Sozlamalar', `${appUrl}/settings`);
  await ctx.reply('Ilova va bildirishnoma sozlamalarini boshqarish:', {
    reply_markup: keyboard,
  });
});

// Telegram Stars pre_checkout_query tasdiqlash
bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

// Telegram Stars successful_payment tasdiqlash
bot.on('message:successful_payment', async (ctx) => {
  const paymentPayload = ctx.message.successful_payment.invoice_payload;
  console.log(`[Telegram Stars Paid] Payload: ${paymentPayload}`);

  try {
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId: paymentPayload },
    });

    if (payment && payment.status !== 'PAID') {
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
            data: { isPremium: true, premiumUntil },
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
      }

      await ctx.reply('🎉 <b>Toʻlovingiz muvaffaqiyatli qabul qilindi!</b>\nXizmatingiz darhol faollashtirildi.', {
        parse_mode: 'HTML',
      });
    }
  } catch (e) {
    console.error('Successful payment qayta ishlashda xatolik:', e);
  }
});

// Faqat token haqiqiy bo'lganda pollingni boshlash
if (token && !token.startsWith('dev_') && token !== 'fake_token') {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
    },
  });
}

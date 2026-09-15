import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const appUrl = process.env.APP_URL || 'http://localhost:5173';

if (!token || token.startsWith('dev_') || token === 'fake_token') {
  console.log('⚠️ Telegram Bot Token mavjud emas yoki dev rejimida. Bot polling oʻtkazib yuborildi.');
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

// Faqat token haqiqiy bo'lganda pollingni boshlash
if (token && !token.startsWith('dev_') && token !== 'fake_token') {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Telegram Bot @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
    },
  });
}

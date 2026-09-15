export class TelegramBotService {
  private static getToken() {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }
  private static getAppUrl() {
    return process.env.APP_URL || 'http://localhost:5173';
  }

  private static async sendTelegramMessage(chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === 'production';
    const token = this.getToken();

    if (!token || token.startsWith('dev_') || token === 'fake_token') {
      if (isProduction) {
        console.error('❌ [Production Telegram Error]: TELEGRAM_BOT_TOKEN haqiqiy token emas!');
        return false;
      }
      console.log(`[Development Mock Bot Notification] To: ${chatId} | Message: ${text}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body: any = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch (e) {
      console.error(`[Telegram Bot Error] Xabar yuborishda xatolik:`, e);
      return false;
    }
  }

  private static getInlineButton(text: string, path = '') {
    const baseUrl = this.getAppUrl();
    const targetUrl = path ? `${baseUrl.replace(/\/$/, '')}${path}` : baseUrl;
    if (targetUrl.startsWith('https://')) {
      return { text, web_app: { url: targetUrl } };
    }
    return { text, url: targetUrl };
  }

  static async sendLikeNotification(chatId: string): Promise<boolean> {
    const text = `❤️ <b>Sizga yangi Like keldi!</b>\n\nKim sizni yoqtirganini koʻrish uchun Yaqin ilovasini oching.`;
    const replyMarkup = {
      inline_keyboard: [[this.getInlineButton('👀 Koʻrish', '/likes')]],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendSuperLikeNotification(chatId: string): Promise<boolean> {
    const text = `⭐ <b>Sizga Super Like keldi!</b>\n\nKimdir sizga alohida qiziqish bildirdi! Ilovaga kirib darhol koʻring.`;
    const replyMarkup = {
      inline_keyboard: [[this.getInlineButton('⭐ Super Likeni koʻrish', '/likes')]],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendMatchNotification(chatId: string, partnerName: string): Promise<boolean> {
    const text = `💫 <b>Tabriklaymiz, yangi Match!</b>\n\nSiz va <b>${partnerName}</b> bir-biringizga yoqdingiz. Hozirning oʻzidayoq suhbatni boshlashingiz mumkin!`;
    const replyMarkup = {
      inline_keyboard: [[this.getInlineButton('💬 Suhbatni boshlash', '/matches')]],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendMessageNotification(chatId: string, senderName: string, snippet: string): Promise<boolean> {
    const text = `💬 <b>${senderName}</b> sizga xabar yubordi:\n\n<i>"${snippet.slice(0, 80)}${snippet.length > 80 ? '...' : ''}"</i>`;
    const replyMarkup = {
      inline_keyboard: [[this.getInlineButton('✉️ Javob yozish', '/matches')]],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }
}

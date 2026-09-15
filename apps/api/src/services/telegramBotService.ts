export class TelegramBotService {
  private static token = process.env.TELEGRAM_BOT_TOKEN;
  private static appUrl = process.env.APP_URL || 'http://localhost:5173';

  private static async sendTelegramMessage(chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
    if (!this.token || this.token.startsWith('dev_') || this.token === 'fake_token') {
      console.log(`[Mock Telegram Bot] To: ${chatId} | Message: ${text}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
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

  static async sendLikeNotification(chatId: string): Promise<boolean> {
    const text = `❤️ <b>Sizga yangi Like keldi!</b>\n\nKim sizni yoqtirganini koʻrish uchun Yaqin ilovasini oching.`;
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '👀 Koʻrish',
            web_app: { url: this.appUrl },
          },
        ],
      ],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendSuperLikeNotification(chatId: string): Promise<boolean> {
    const text = `⭐ <b>Sizga Super Like keldi!</b>\n\nKimdir sizga alohida qiziqish bildirdi! Ilovaga kirib darhol koʻring.`;
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '⭐ Super Likeni koʻrish',
            web_app: { url: this.appUrl },
          },
        ],
      ],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendMatchNotification(chatId: string, partnerName: string): Promise<boolean> {
    const text = `💫 <b>Tabriklaymiz, yangi Match!</b>\n\nSiz va <b>${partnerName}</b> bir-biringizga yoqdingiz. Hozirning oʻzidayoq suhbatni boshlashingiz mumkin!`;
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '💬 Suhbatni boshlash',
            web_app: { url: this.appUrl },
          },
        ],
      ],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }

  static async sendMessageNotification(chatId: string, senderName: string, snippet: string): Promise<boolean> {
    const text = `💬 <b>${senderName}</b> sizga xabar yubordi:\n\n<i>"${snippet.slice(0, 80)}${snippet.length > 80 ? '...' : ''}"</i>`;
    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '✉️ Javob yozish',
            web_app: { url: this.appUrl },
          },
        ],
      ],
    };
    return this.sendTelegramMessage(chatId, text, replyMarkup);
  }
}

class TelegramAPI {
  #URL: string = "https://api.telegram.org";
  #API_KEY: string | null = "8463226469:AAHjMi20nljog9DASopekM4_DNzap433hkU";
  constructor(API_KEY: string) {
    this.#API_KEY = API_KEY;
  }

  async sendMessageWithInlineKeyboard(
    chat_id: number,
    message: any,
    keyboard: any
  ): Promise<any> {
    try {
//       const message = `
//           *🛍 НОВЫЙ ТОВАР*
// *Название:* ${body.name}
// *Цена:* \`${body.price}₽\`
// *Категория:* ${body.category.name}`;
//       const keyboard = {
//         inline_keyboard: [
//           [
//             { text: "✅ Посмотреть", callback_data: "approve_123" },
//             {
//               text: "🌐 Открыть WebApp",
//               web_app: {
//                 url: "https://ваш-сайт.ру/app",
//               },
//             },
//           ],
//         ],
//       };
//       if (body.telegram_notification) {
//         const resultNotification =
//           await telegramAPI.sendMessageWithInlineKeyboard(
//             -1003304218563,
//             message,
//             keyboard
//           );
//         const data = await resultNotification.json();
//         console.log(data);
//       }
      return await fetch(`${this.#URL}/bot${this.#API_KEY}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id,
          text: message,
          parse_mode: "Markdown",
          reply_markup: keyboard,
          disable_web_page_preview: true,
        }),
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default TelegramAPI;

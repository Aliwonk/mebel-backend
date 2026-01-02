class TelegramAPI {
  #URL: string = "https://api.telegram.org";
  #API_KEY: string | null = null;

  constructor(API_KEY: string) {
    this.#API_KEY = API_KEY;
  }

  // Метод для отправки фото с подписью и клавиатурой
  async sendPhotoWithCaption(
    chat_id: number,
    photo: string,
    caption: string = "",
    keyboard?: any
  ): Promise<any> {
    try {
      const payload: any = {
        chat_id,
        photo,
        caption,
        parse_mode: "Markdown",
      };

      if (keyboard) {
        payload.reply_markup = keyboard;
      }

      const response = await fetch(
        `${this.#URL}/bot${this.#API_KEY}/sendPhoto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Telegram API Error:", error);
      throw error;
    }
  }

  // Метод для отправки альбома (несколько фото)
  async sendMediaGroup(
    chat_id: number,
    media: Array<any>,
    keyboard?: any
  ): Promise<any> {
    try {
      const payload: any = {
        chat_id,
        media: JSON.stringify(media),
      };

      if (keyboard) {
        payload.reply_markup = keyboard;
      }

      const response = await fetch(
        `${this.#URL}/bot${this.#API_KEY}/sendMediaGroup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Telegram API Error:", error);
      throw error;
    }
  }

  // Метод для отправки обычного сообщения с клавиатурой
  async sendMessageWithInlineKeyboard(
    chat_id: number,
    message: string,
    keyboard?: any
  ): Promise<any> {
    try {
      const payload: any = {
        chat_id,
        text: message,
        parse_mode: "Markdown",
      };

      if (keyboard) {
        payload.reply_markup = keyboard;
      }

      const response = await fetch(
        `${this.#URL}/bot${this.#API_KEY}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Telegram API Error:", error);
      throw error;
    }
  }
}

export default TelegramAPI;

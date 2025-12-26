import { Router } from "express";
import telegramBotRoute from "./routes/bot.route";

const telegramRouter = Router();

telegramRouter.use("/bot", telegramBotRoute);

export default telegramRouter;

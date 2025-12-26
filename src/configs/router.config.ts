import { Router } from "express";
import productRouter from "../modules/products/routes/router";
import storeRouter from "../modules/store/router";
import authRouter from "../modules/auth/routes/router";
import telegramRouter from "../modules/telegram/router";

const configRouter = Router();

configRouter.use("/product", productRouter);
configRouter.use("/telegram", telegramRouter);
configRouter.use("/store", storeRouter);
configRouter.use("/auth", authRouter);

export default configRouter;

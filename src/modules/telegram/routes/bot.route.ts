import { Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";

const telegramBotRoute = Router();

telegramBotRoute.get("", (req: Request, res: Response) => {
  try {
    console.log("telegram bot route");
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default telegramBotRoute;

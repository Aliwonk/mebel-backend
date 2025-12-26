import { configDotenv } from "dotenv";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";

configDotenv({ quiet: true });

export const Guard = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).send({ message: "Отсутствует авторизация" });
    const typeToken = authHeader.split(" ")[0];
    const token = authHeader.split(" ")[1];
    if (typeToken !== "Bearer")
      return res.status(401).send({ message: "Неверный тип токена" });
    if (!token) return res.status(401).send({ message: "Отсутствует токен" });

    const decode = verify(token, String(process.env.JWT_KEY));
    res.locals.admin = {
      id: (decode as { id: number }).id,
    };
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError)
      return res.status(401).send({ message: "Токен истек" });
    return res.status(401).send({ message: "Неверный токен" });
  }
};

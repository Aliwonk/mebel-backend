import { Response } from "express";
import {
  BaseError,
  UniqueConstraintError,
  ValidationError,
  ConnectionAcquireTimeoutError,
} from "sequelize";

function handleControllerError(route: string, error: any, res: Response) {
  console.log(`На маршруте ${route} произошла ошибка: ${error}`);
  if (error instanceof BaseError) {
    if (error instanceof UniqueConstraintError)
      return res.status(400).send({ message: "Сущность уже существует" });
    if (error instanceof ValidationError)
      return res
        .status(400)
        .send({ message: error.message.split(":")[1].trim() });
    if (error instanceof ConnectionAcquireTimeoutError)
      return res
        .status(503)
        .send({ message: "Превышено время ожидания к серверу" });
  }

  res.status(500).send({ message: "На стороне сервера произошла ошибка" });
}

export { handleControllerError };

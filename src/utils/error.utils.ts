import { Response } from "express";
import { BaseError, UniqueConstraintError, ValidationError } from "sequelize";

function handleControllerError(route: string, error: any, res: Response) {
  console.log(`На маршруте ${route} произошла ошибка: ${error}`);
  if (error instanceof BaseError) {
    if (error instanceof UniqueConstraintError)
      return res.status(400).send({ message: "Сущность уже существует" });
    if (error instanceof ValidationError)
      return res.status(400).send({ message: error.message.split(":")[1].trim() });
  }

  res.status(500).send({ message: "На стороне сервера произошла ошибка" });
}

export { handleControllerError };

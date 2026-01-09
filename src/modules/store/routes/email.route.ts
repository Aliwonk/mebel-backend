import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import StoreEmailModel from "../models/email.model";
import { Guard } from "../../../utils/security.util";

const storeEmailRoute = Router();

storeEmailRoute.post(
  "/",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { email, name, isMain } = req.body;
      if (!email || typeof email !== "string" || email.trim() === "")
        return res.status(400).send({ message: "Email не может быть пустым" });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res
          .status(400)
          .send({ message: "Email должен быть корректным" });

      const emailIsMain = await StoreEmailModel.findAll({
        where: { isMain: true },
      });

      if (emailIsMain.length > 0)
        return res
          .status(400)
          .send({ message: "email с показом уже существует" });

      await StoreEmailModel.create({ email: email.trim(), name, isMain });
      res.status(201).send({ message: "Email успешно добавлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storeEmailRoute.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const existsEmail = await StoreEmailModel.findByPk(id);
    if (!existsEmail)
      return res.status(404).send({ message: "Email не найден" });

    await StoreEmailModel.update({ ...body }, { where: { id } });
    res.status(200).send({ message: "Данные обновлены" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storeEmailRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const emails = await StoreEmailModel.findAll();
    res.status(200).send({ data: emails });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storeEmailRoute.delete("/:id", Guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = await StoreEmailModel.findByPk(id);
    if (!email) return res.status(404).send({ message: "Email не найден" });

    await StoreEmailModel.destroy({ where: { id } });
    res.status(200).send({ message: "Email успешно удален" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default storeEmailRoute;

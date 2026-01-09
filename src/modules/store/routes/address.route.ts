import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import StoreAddressModel from "../models/address.model";
import { Guard } from "../../../utils/security.util";

const storeAddressRoute = Router();

storeAddressRoute.post(
  "/",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { address, hours } = req.body;

      // Валидация
      if (!address || typeof address !== "string" || address.trim() === "")
        return res.status(400).send({ message: "Адрес не может быть пустым" });

      // Проверка минимальной длины адреса (можно настроить)
      if (address.trim().length < 5)
        return res.status(400).send({ message: "Адрес слишком короткий" });

      // Проверка максимальной длины (опционально)
      if (address.trim().length > 500)
        return res.status(400).send({ message: "Адрес слишком длинный" });

      await StoreAddressModel.create({ address: address.trim(), hours });
      res.status(201).send({ message: "Адрес успешно добавлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storeAddressRoute.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const existsAddress = await StoreAddressModel.findByPk(id);
    if (!existsAddress)
      return res.status(404).send({ message: "Адрес не найден" });

    await StoreAddressModel.update({ ...body }, { where: { id } });
    res.status(200).send({ message: "Данные обновлены" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storeAddressRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const addresses = await StoreAddressModel.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });
    res.status(200).send({ data: addresses });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storeAddressRoute.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const address = await StoreAddressModel.findByPk(id);

    if (!address) return res.status(404).send({ message: "Адрес не найден" });

    await StoreAddressModel.destroy({ where: { id } });
    res.status(200).send({ message: "Адрес успешно удален" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storeAddressRoute.put(
  "/:id",
  Guard,
  json(),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { address } = req.body;

      const existingAddress = await StoreAddressModel.findByPk(id);
      if (!existingAddress)
        return res.status(404).send({ message: "Адрес не найден" });

      // Валидация
      if (!address || typeof address !== "string" || address.trim() === "")
        return res.status(400).send({ message: "Адрес не может быть пустым" });

      if (address.trim().length < 5)
        return res.status(400).send({ message: "Адрес слишком короткий" });

      if (address.trim().length > 500)
        return res.status(400).send({ message: "Адрес слишком длинный" });

      await existingAddress.update({ address: address.trim() });
      res.status(200).send({ message: "Адрес успешно обновлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

export default storeAddressRoute;

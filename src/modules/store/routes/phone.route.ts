import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import StorePhoneModel from "../models/phone.model";
import { Op } from "sequelize";
import { Guard } from "../../../utils/security.util";

const storePhoneRoute = Router();

storePhoneRoute.post(
  "/",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { phone, name, isMain } = req.body;

      // Валидация
      if (!phone || typeof phone !== "string" || phone.trim() === "")
        return res
          .status(400)
          .send({ message: "Телефон не может быть пустым" });

      // Очистка номера от лишних символов (скобки, пробелы, дефисы)
      const cleanedPhone = phone.trim().replace(/[\s\(\)\-]/g, "");

      // Проверка формата телефона
      const phoneRegex = /^(\+7|7|8)?[\d\- ]{10,15}$/;
      if (!phoneRegex.test(phone))
        return res
          .status(400)
          .send({ message: "Некорректный формат телефона" });

      // Проверка длины (минимально 10 цифр для российских номеров)
      const digitsOnly = cleanedPhone.replace(/\D/g, "");
      if (digitsOnly.length < 10)
        return res.status(400).send({ message: "Телефон слишком короткий" });

      if (digitsOnly.length > 15)
        return res.status(400).send({ message: "Телефон слишком длинный" });

      // Проверка на дубликат (опционально)
      const existingPhone = await StorePhoneModel.findOne({
        where: { phone: cleanedPhone },
      });
      if (existingPhone)
        return res.status(409).send({ message: "Этот телефон уже существует" });

      const phonesIsMain = await StorePhoneModel.findAll({
        where: { isMain: true },
      });
      if (phonesIsMain.length > 0)
        return res
          .status(400)
          .send({ message: "Телефон с показом уже существует" });
      await StorePhoneModel.create({ phone: cleanedPhone, name, isMain });
      res.status(201).send({ message: "Телефон успешно добавлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storePhoneRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const phones = await StorePhoneModel.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).send({ data: phones });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storePhoneRoute.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phone = await StorePhoneModel.findByPk(id);

    if (!phone) return res.status(404).send({ message: "Телефон не найден" });

    res.status(200).send({ data: phone });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

storePhoneRoute.put(
  "/:id",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { phone, name } = req.body;

      let cleanedPhone: string | null = null;
      let existingPhone: StorePhoneModel | null = null;
      // Валидация телефона
      if (phone) {
        existingPhone = await StorePhoneModel.findByPk(id);
        if (!existingPhone)
          return res.status(404).send({ message: "Телефон не найден" });

        if (typeof phone !== "string" || phone.trim() === "")
          return res
            .status(400)
            .send({ message: "Телефон не может быть пустым" });

        cleanedPhone = phone.trim().replace(/[\s\(\)\-]/g, "");
        const phoneRegex = /^(\+7|7|8)?[\d\- ]{10,15}$/;
        if (!phoneRegex.test(phone))
          return res
            .status(400)
            .send({ message: "Некорректный формат телефона" });

        const digitsOnly = cleanedPhone.replace(/\D/g, "");
        if (digitsOnly.length < 10)
          return res.status(400).send({ message: "Телефон слишком короткий" });

        if (digitsOnly.length > 15)
          return res.status(400).send({ message: "Телефон слишком длинный" });

        // Проверка на дубликат (исключая текущую запись)
        const duplicatePhone = await StorePhoneModel.findOne({
          where: { phone: cleanedPhone, id: { [Op.not]: id } }, // Используем Op.not для исключения текущей записи
        });

        if (duplicatePhone)
          return res
            .status(409)
            .send({ message: "Этот телефон уже существует" });
      }

      await StorePhoneModel.update(
        {
          phone: phone ? cleanedPhone : existingPhone?.dataValues.phone,
          name: name ? name : existingPhone?.dataValues.name,
        },
        { where: { id } }
      );
      res.status(200).send({ message: "Телефон успешно обновлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storePhoneRoute.delete("/:id", Guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phone = await StorePhoneModel.findByPk(id);

    if (!phone) return res.status(404).send({ message: "Телефон не найден" });

    await StorePhoneModel.destroy({ where: { id } });
    res.status(200).send({ message: "Телефон успешно удален" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

// storePhoneRoute.get("/search/:query", async (req: Request, res: Response) => {
//   try {
//     const { query } = req.params;
//     const phones = await StorePhoneModel.findAll({
//       where: {
//         phone: {
//           [Op.like]: `%${query}%`,
//         },
//       },
//     });

//     res.status(200).send({ data: phones });
//   } catch (error) {
//     handleControllerError(req.baseUrl, error, res);
//   }
// });

export default storePhoneRoute;

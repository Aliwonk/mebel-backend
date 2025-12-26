import { Router, Request, Response, json } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import AdminModel from "../models/Admins.model";
import { configDotenv } from "dotenv";
import { compare, genSalt, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { Guard } from "../../../utils/security.util";

configDotenv({ quiet: true });
const authRouter = Router();

authRouter.post("/register", json(), async (req: Request, res: Response) => {
  try {
    const { surname, name, login, password, super_admin_password } = req.body;
    if (!login || login.length === 0)
      return res.status(400).send({ message: "Логин не может быть пустым" });
    if (!password || password.length === 0)
      return res.status(400).send({ message: "Пароль не может быть пустым" });
    if (super_admin_password !== process.env.SUPER_ADMIN_PASSWORD)
      return res
        .status(403)
        .send({ message: "Недостаточно прав для регистрации администратора" });

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    await AdminModel.create({
      surname,
      name,
      login,
      hash_password: hashedPassword,
    });
    res.status(201).send({ message: "Администратор успешно зарегистрирован" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

authRouter.post("/login", json(), async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    const admin: AdminModel | null = await AdminModel.findOne({
      where: { login },
    });
    if (!admin)
      return res.status(401).send({ message: "Неверный логин или пароль" });

    const checkPassword: boolean = await compare(
      password,
      admin.hash_password.toString()
    );
    if (!checkPassword)
      return res.status(401).send({ message: "Неверный логин или пароль" });

    const token: string = sign({ id: admin.id }, String(process.env.JWT_KEY), {
      expiresIn: Number(process.env.JWT_EXPIRES),
    });
    res.status(200).send({ token, expires: process.env.JWT_EXPIRES });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

authRouter.get("/admins", Guard, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, all = false } = req.query;
    const offset: number = (Number(page) - 1) * Number(limit);

    if (all) {
      const admins = await AdminModel.findAll({
        attributes: { exclude: ["hash_password"] },
      });
      return res.status(200).send({ data: admins, count: admins.length });
    } else {
      const admins = await AdminModel.findAndCountAll({
        attributes: { exclude: ["hash_password"] },
        limit: Number(limit),
        offset,
      });
      return res.status(200).send({
        data: admins.rows,
        count: admins.count,
      });
    }
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

authRouter.delete(
  "/delete/:id",
  Guard,
  json(),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { super_admin_password } = req.body;
      if (super_admin_password !== process.env.SUPER_ADMIN_PASSWORD)
        return res
          .status(403)
          .send({ message: "Недостаточно прав для удаления администратора" });
      const admin = await AdminModel.findByPk(id);
      if (!admin)
        return res.status(404).send({ message: "Администратор не найден" });

      await AdminModel.destroy({ where: { id } });
      res.status(200).send({ message: "Администратор успешно удален" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

export default authRouter;

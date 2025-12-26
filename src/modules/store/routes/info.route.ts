import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import multer = require("multer");
import { imageFileFilter, storageImage } from "../../../utils/upload.util";
import StoreModel from "../models/store.model";
import { configDotenv } from "dotenv";
import { Guard } from "../../../utils/security.util";

const storeInfoRoute = Router();
configDotenv({ quiet: true });
const upload = multer({
  storage: storageImage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});

storeInfoRoute.post(
  "/",
  Guard,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { file, body } = req;

      const existStore = await StoreModel.findAll();
      if (existStore.length > 0)
        return res.status(400).send({ message: "Магазин уже существует" });

      await StoreModel.create({
        name: body.name,
        description: body.description,
        url_logo: file
          ? `${process.env.SERVER_URL}/store/image/${file.filename}`
          : null,
      });

      res.status(201).send({ message: "Магазин создан" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storeInfoRoute.put(
  "/",
  Guard,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const { file, body } = req;
      const store = await StoreModel.findByPk(1);
      if (!store) return res.status(404).send({ message: "Магазин не найден" });

      await StoreModel.update(
        {
          name: body.name ? body.name : store.name,
          description: body.description ? body.description : store.description,
          url_logo: file
            ? `${process.env.SERVER_URL}/store/image/${file.filename}`
            : store.url_logo,
        },
        {
          where: { id: 1 },
        }
      );
      res.status(200).send({ message: "Магазин обновлен" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storeInfoRoute.get("/", async (req: Request, res: Response) => {
  try {
    const store = await StoreModel.findByPk(1);
    if (!store) return res.status(404).send({ message: "Магазин не найден" });

    res.status(200).send({ data: store.dataValues });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default storeInfoRoute;

import { Router, Request, Response } from "express";
import { handleControllerError } from "../../../utils/error.utils";
import { join } from "path";
import { existsSync } from "fs";
import { configDotenv } from "dotenv";
import multer = require("multer");
import { imageFileFilter, storageImage } from "../../../utils/upload.util";
import StoreImageModel from "../models/image.model";

const storeImageRoute = Router();
configDotenv({ quiet: true });
const upload = multer({
  storage: storageImage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});

storeImageRoute.post(
  "",
  upload.array("images"),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        return res.status(400).send({ message: "Файлы не загружены" });

      const images = files.map((file) => ({
        url: `${process.env.SERVER_URL}/store/image/${file.filename}`,
        size: file.size,
      }));

      await StoreImageModel.bulkCreate(images);
      res.status(201).send({ message: "Картинки загружены" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

storeImageRoute.get("/:filename", (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const path = join(process.cwd(), "uploads", "images", filename);
    const existFile = existsSync(path);
    if (!existFile) return res.status(404).send({ message: "Файл не найден" });
    res.status(200).sendFile(path);
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default storeImageRoute;

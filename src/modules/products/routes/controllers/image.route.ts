import { Router, Request, Response } from "express";
import { handleControllerError } from "../../../../utils/error.utils";
import { existsSync } from "fs";
import { join } from "path";
import multer = require("multer");
import { imageFileFilter, storageImage } from "../../../../utils/upload.util";
import ProductModel from "../../models/Products.model";
import ProductImageModel from "../../models/Images.model";
import { configDotenv } from "dotenv";
import { Guard } from "../../../../utils/security.util";

const productImageRoute = Router();
configDotenv({ quiet: true });
const upload = multer({
  storage: storageImage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});

productImageRoute.get("/:filename", async (req: Request, res: Response) => {
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

productImageRoute.post(
  "/",
  Guard,
  upload.array("images", 10),
  async (req: Request, res: Response) => {
    try {
      const { product_id } = req.body;
      const product = await ProductModel.findByPk(product_id);
      if (!product) return res.status(404).send({ message: "Товар не найден" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        return res.status(400).send({ message: "Файлы не загружены" });

      const images = files.map((file) => ({
        url: `${process.env.SERVER_URL}/product/image/${file.filename}`,
        size: file.size,
        product_id: product.id,
      }));

      await ProductImageModel.bulkCreate(images);
      res.status(201).send({ message: "Картинки загружены" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

export default productImageRoute;

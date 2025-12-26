import { Router, json, Request, Response } from "express";
import * as multer from "multer";
import { Op } from "sequelize";
import ProductModel from "../../models/Products.model";
import { imageFileFilter, storageImage } from "../../../../utils/upload.util";
import { handleControllerError } from "../../../../utils/error.utils";
import { ProductRequestInterface } from "../../types/product.type";
import sequelizePOSTGRES from "../../../../configs/db.config";
import ProductCatalogModel from "../../models/Catalogs.model";
import ProductCategoryModel from "../../models/Category.model";
import ProductManufacturerModel from "../../models/Manufacturers.model";
import ProductDimensionModel from "../../models/Dimension.model";
import { configDotenv } from "dotenv";
import ProductImageModel from "../../models/Images.model";
import { Guard } from "../../../../utils/security.util";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readFile, unlink, writeFile } from "node:fs/promises";

const productRoute = Router();
configDotenv({ quiet: true });
const upload = multer({
  storage: storageImage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
});

productRoute.post(
  "/",
  Guard,
  json(),
  upload.array("images"),
  async (req: Request, res: Response) => {
    const transaction = await sequelizePOSTGRES.transaction();
    try {
      const productData: ProductRequestInterface = req.body;
      if (!productData.name || !productData.price)
        return res
          .status(400)
          .send({ message: "Обязательно должен быть название и цена товара" });

      if (!productData.dimensions)
        return res
          .status(400)
          .send({ message: "Обязательно должен быть размеры товара" });

      if (!productData.catalog_id && !productData.catalog)
        return res
          .status(400)
          .send({ message: "Обязательно должен быть каталог товара" });

      if (!productData.category_id && !productData.category)
        return res
          .status(400)
          .send({ message: "Обязательно должен быть категория товара" });

      if (!productData.manufacturer_id && !productData.manufacturer)
        return res
          .status(400)
          .send({ message: "Обязательно должен быть производитель товара" });

      const productCatalog = productData.catalog_id
        ? await ProductCatalogModel.findByPk(productData.catalog_id, {
            transaction,
          })
        : await ProductCatalogModel.create(
            { name: JSON.parse(productData.catalog).name },
            { transaction }
          );

      if (!productCatalog)
        return res.status(404).send({ message: "Каталог не найден" });

      const productCategory = productData.category_id
        ? await ProductCategoryModel.findByPk(productData.category_id, {
            transaction,
          })
        : await ProductCategoryModel.create(
            { name: JSON.parse(productData.category).name },
            { transaction }
          );

      if (!productCategory)
        return res.status(404).send({ message: "Категория не найдена" });

      const productManufacturer = productData.manufacturer_id
        ? await ProductManufacturerModel.findByPk(productData.manufacturer_id, {
            transaction,
          })
        : await ProductManufacturerModel.create(
            { name: JSON.parse(productData.manufacturer).name },
            { transaction }
          );

      if (!productManufacturer)
        return res.status(404).send({ message: "Производитель не найден" });

      // Создание товара

      const product = await ProductModel.create(
        {
          name: productData.name,
          price: productData.price,
          description: productData.description,
        },
        { transaction }
      );

      await ProductDimensionModel.create(
        {
          ...productData.dimensions,
          product_id: product.dataValues.id,
        },
        { transaction }
      );

      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const images = (req.files as Express.Multer.File[]).map((file) => ({
          url: `${process.env.SERVER_URL}/product/image/${file.filename}`,
          size: file.size,
          product_id: product.dataValues.id,
        }));
        await ProductImageModel.bulkCreate(images, {
          transaction,
        });
      }

      // Добавление связей

      await productCatalog.addCategory(productCategory, { transaction });
      await productCategory.addProduct(product, { transaction });
      await productManufacturer.addProduct(product, { transaction });

      await transaction.commit();
      res.status(201).send({ message: "Товар создан" });
    } catch (error) {
      await transaction.rollback();
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      all = false,
      catalog_id = null,
      category_id = null,
      manufacturer_id = null,
      search = null,
      min_price = null,
      max_price = null,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = req.query;

    const offset: number = (Number(page) - 1) * Number(limit);

    // Базовые опции запроса
    const queryOptions: any = {
      include: [
        {
          model: ProductCategoryModel,
          as: "categories",
          through: { attributes: [] },
          attributes: ["id", "name"],
          include: [
            {
              model: ProductCatalogModel,
              as: "catalogs",
              through: { attributes: [] },
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: ProductManufacturerModel,
          as: "manufacturers",
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
        {
          model: ProductDimensionModel,
          as: "dimensions",
        },
        {
          model: ProductImageModel,
          as: "images",
        },
      ],
      order: [[sort_by, sort_order]],
    };

    // WHERE условия
    const whereConditions: any = {};

    // Фильтр по цене
    if (min_price || max_price) {
      whereConditions.price = {};
      if (min_price) whereConditions.price[Op.gte] = Number(min_price);
      if (max_price) whereConditions.price[Op.lte] = Number(max_price);
    }

    // Поиск
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (Object.keys(whereConditions).length > 0) {
      queryOptions.where = whereConditions;
    }

    // Фильтр по каталогу (через категории)
    if (catalog_id) {
      queryOptions.include[0].include[0].where = { id: catalog_id };
      queryOptions.include[0].required = true;
    }

    // Фильтр по категории
    if (category_id) {
      queryOptions.include[0].where = { id: category_id };
      queryOptions.include[0].required = true;
    }

    // Фильтр по производителю
    if (manufacturer_id) {
      queryOptions.include[1].where = { id: manufacturer_id };
      queryOptions.include[1].required = true;
    }

    queryOptions.distinct = true;

    if (all) {
      const products = await ProductModel.findAll(queryOptions);
      return res.status(200).send({
        data: products,
        count: products.length,
        page: Number(page),
        totalPages: Math.ceil(products.length / Number(limit)),
      });
    } else {
      queryOptions.offset = offset;
      queryOptions.limit = Number(limit);

      const products = await ProductModel.findAndCountAll(queryOptions);

      res.status(200).send({
        data: products.rows,
        count: products.count,
        page: Number(page),
        totalPages: Math.ceil(products.count / Number(limit)),
      });
    }
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productRoute.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findByPk(id, {
      include: [
        {
          model: ProductCategoryModel,
          as: "categories",
          through: { attributes: [] },
          attributes: ["id", "name"],
          include: [
            {
              model: ProductCatalogModel,
              as: "catalogs",
              through: { attributes: [] },
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: ProductManufacturerModel,
          as: "manufacturers",
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
        {
          model: ProductImageModel,
          as: "images",
        },
        {
          model: ProductDimensionModel,
          as: "dimensions",
        },
      ],
    });
    if (!product) return res.status(404).send({ message: "Товар не найден" });
    res.status(200).send({ data: product.dataValues });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productRoute.delete("/:id", async (req: Request, res: Response) => {
  const transaction = await sequelizePOSTGRES.transaction();
  let copyFiles: Array<{ path: string; data: Buffer }> = [];
  try {
    const { id } = req.params;
    const existsProduct = await ProductModel.findByPk(id);
    if (!existsProduct)
      return res.status(404).send({ message: "Товар не найден" });

    const imagesProduct = await ProductImageModel.findAll({
      where: { product_id: id },
    });

    for (const image of imagesProduct) {
      const seperatUrl = image.dataValues.url.split("/");
      const filename = seperatUrl[seperatUrl.length - 1];
      const pathFile = join(process.cwd(), "uploads", "images", filename);
      const existsFile = existsSync(pathFile);

      if (existsFile) {
        const copyFile: Buffer = await readFile(pathFile);
        copyFiles.push({
          path: pathFile,
          data: copyFile,
        });
        await unlink(pathFile);
        await ProductImageModel.destroy({ where: { id: image.dataValues.id } });
      } else {
        await ProductImageModel.destroy({ where: { id: image.dataValues.id } });
      }
    }
    copyFiles = [];

    await ProductModel.destroy({ where: { id: id } });
    res.status(200).send({ message: "Товар удален" });
  } catch (error) {
    await transaction.rollback();
    for (const file of copyFiles) {
      await writeFile(file.path, file.data);
    }
    handleControllerError(req.baseUrl, error, res);
  }
});

export default productRoute;

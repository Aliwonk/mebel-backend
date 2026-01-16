import { Router, json, Request, Response } from "express";
import * as multer from "multer";
import { Op, Transaction } from "sequelize";
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
import TelegramAPI from "../../../../utils/telegramAPI.util";
import TelegramGroupModel from "../../../telegram/models/group.model";

const productRoute = Router();
configDotenv({ quiet: true });
const telegram: TelegramAPI = new TelegramAPI(String(process.env.BOT_TOKEN));
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
            { name: JSON.parse(productData.catalog as string).name },
            { transaction }
          );

      if (!productCatalog)
        return res.status(404).send({ message: "Каталог не найден" });

      const productCategory = productData.category_id
        ? await ProductCategoryModel.findByPk(productData.category_id, {
            transaction,
          })
        : await ProductCategoryModel.create(
            { name: JSON.parse(productData.category as string).name },
            { transaction }
          );

      if (!productCategory)
        return res.status(404).send({ message: "Категория не найдена" });

      const productManufacturer = productData.manufacturer_id
        ? await ProductManufacturerModel.findByPk(productData.manufacturer_id, {
            transaction,
          })
        : await ProductManufacturerModel.create(
            { name: JSON.parse(productData.manufacturer as string).name },
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

      const dimensions =
        typeof productData.dimensions === "string"
          ? JSON.parse(productData.dimensions)
          : productData.dimensions;

      await ProductDimensionModel.create(
        {
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height,
          weight: dimensions.weight,
          depth: dimensions.depth,
          product_id: product.dataValues.id,
        },
        { transaction }
      );

      let images: Array<{ url: string; size: number; product_id: number }> = [];
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        images = (req.files as Express.Multer.File[]).map((file) => ({
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

      // Отправка уведолмение в телеграм бот

      if (
        productData.telegram_notification &&
        productData.telegram_notification === true
      ) {
        console.log("Телеграм уведомление включена");
        const telegramGroups: Array<TelegramGroupModel> =
          await TelegramGroupModel.findAll();

        if (telegramGroups.length > 0) {
          console.log("Отправка телеграм поста");
          const telegramGroup: TelegramGroupModel = telegramGroups[0];

          // Формируем сообщение с информацией о товаре
          const categoryName = productCategory.dataValues.name.replace(
            /\s/g,
            ""
          );
          const manufacturerName = productManufacturer.dataValues.name.replace(
            /\s/g,
            ""
          );
          const message =
            `🎉 *Добавлен товар!* #${categoryName} #${manufacturerName} \n\n` +
            `📦 *Название:* ${productData.name}\n` +
            `💰 *Цена:* ${productData.price} руб.\n\n` +
            `📝 *Описание:*\n ${
              productData.description || "Нет описания"
            }\n\n` +
            `📏 *Размеры (ШxГxВ):* ${dimensions?.width || 0}x${
              dimensions?.depth || 0
            }x${dimensions?.height || 0} мм`;

          const keyboard = {
            inline_keyboard: [
              [
                {
                  text: "✅ Посмотреть товар",
                  url: `${process.env.CLIENT_URL}/product/${product.dataValues.id}`,
                },
              ],
            ],
          };

          let telegramResult;

          if (images.length > 0) {
            if (images.length === 1) {
              telegramResult = await telegram.sendPhotoWithCaption(
                Number(telegramGroup.dataValues.chat_id),
                images[0].url,
                message,
                keyboard
              );
            } else {
              const media = images.map((image, index) => ({
                type: "photo",
                media: image.url,
                caption: index === 0 ? message : undefined, // Подпись только у первого фото
                parse_mode: "Markdown",
              }));

              telegramResult = await telegram.sendMediaGroup(
                Number(telegramGroup.dataValues.chat_id),
                media
              );

              if (telegramResult.ok) {
                const buttonsMessage = `Для деталей нажмите кнопку ниже 👇`;
                await telegram.sendMessageWithInlineKeyboard(
                  Number(telegramGroup.dataValues.chat_id),
                  buttonsMessage,
                  keyboard
                );
              }
            }
          } else {
            telegramResult = await telegram.sendMessageWithInlineKeyboard(
              Number(telegramGroup.dataValues.chat_id),
              message,
              keyboard
            );
          }
        }
      }

      await transaction.commit();
      res.status(201).send({ message: "Товар создан" });
    } catch (error) {
      await transaction.rollback();
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productRoute.put(
  "/:id",
  Guard,
  json(),
  upload.array("images"),
  async (req: Request, res: Response) => {
    const transaction = await sequelizePOSTGRES.transaction();
    try {
      const { id } = req.params;
      const productData: ProductRequestInterface = req.body;

      // Проверяем существование товара
      const existingProduct = await ProductModel.findByPk(id, {
        include: [
          {
            model: ProductCategoryModel,
            as: "categories",
            through: { attributes: [] },
          },
          {
            model: ProductManufacturerModel,
            as: "manufacturers",
            through: { attributes: [] },
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
        transaction,
      });

      if (!existingProduct) {
        await transaction.rollback();
        return res.status(404).send({ message: "Товар не найден" });
      }

      // Обновление основных данных товара
      if (
        productData.name ||
        productData.price !== undefined ||
        productData.description !== undefined
      ) {
        await existingProduct.update(
          {
            name: productData.name || existingProduct.dataValues.name,
            price:
              productData.price !== undefined
                ? productData.price
                : existingProduct.dataValues.price,
            description:
              productData.description !== undefined
                ? productData.description
                : existingProduct.dataValues.description,
          },
          { transaction }
        );
      }

      // Обновление габаритов
      if (productData.dimensions) {
        const existingDimensions = existingProduct.dataValues.dimensions;
        if (existingDimensions) {
          await ProductDimensionModel.update(
            {
              ...productData.dimensions,
            },
            {
              where: { product_id: id },
              transaction,
            }
          );
        } else {
          await ProductDimensionModel.create(
            {
              ...productData.dimensions,
              product_id: Number(id),
            },
            { transaction }
          );
        }
      }

      // Обработка категории
      if (productData.category_id || productData.category) {
        await ProductCategoryModel.destroy({
          where: { product_id: id },
          transaction,
        });

        if (productData.catalog_id) {
          await ProductCategoryModel.update(
            {
              priduct_id: Number(id),
            },
            { where: { id: productData.category_id } }
          );
        }

        if (productData.catalog) {
          await ProductCategoryModel.create(
            {
              name: JSON.parse(productData.category!).name,
              product_id: Number(id),
            },
            { transaction }
          );
        }
        // const productCategory = productData.category_id
        //   ? await ProductCategoryModel.findByPk(productData.category_id, {
        //       transaction,
        //     })
        //   :

        // if (!productCategory) {
        //   await transaction.rollback();
        //   return res.status(404).send({ message: "Категория не найдена" });
        // }

        // // Устанавливаем категорию для продукта (удаляет старые и добавляет новую)
        // await ProductCategoryModel.destroy({
        //   where: { product_id: id },
        // });

        // Обработка каталога для категории
        // if (productData.catalog_id || productData.catalog) {
        //   const productCatalog = productData.catalog_id
        //     ? await ProductCatalogModel.findByPk(productData.catalog_id, {
        //         transaction,
        //       })
        //     : await ProductCatalogModel.create(
        //         { name: JSON.parse(productData.catalog!).name },
        //         { transaction }
        //       );

        //   if (!productCatalog) {
        //     await transaction.rollback();
        //     return res.status(404).send({ message: "Каталог не найден" });
        //   }

        //   // Устанавливаем каталог для категории (удаляет старые и добавляет новый)
        //   await ProductCatalogModel.destroy({ where: { category_id } })
        //   await productCategory.setCatalogs([productCatalog], { transaction });
        // }
      }

      // Обработка производителя
      if (productData.manufacturer_id || productData.manufacturer) {
        await ProductManufacturerModel.destroy({
          where: { product_id: id },
          transaction,
        });

        if (productData.manufacturer_id) {
          // await ProductManufacturerModel.update({
          //   product_id: Number(id)
          // })
        }
        // const productManufacturer = productData.manufacturer_id
        //   ? await ProductManufacturerModel.findByPk(
        //       productData.manufacturer_id,
        //       {
        //         transaction,
        //       }
        //     )
        //   : await ProductManufacturerModel.create(
        //       { name: JSON.parse(productData.manufacturer!).name },
        //       { transaction }
        //     );

        // if (!productManufacturer) {
        //   await transaction.rollback();
        //   return res.status(404).send({ message: "Производитель не найден" });
        // }

        // // Устанавливаем производителя для продукта (удаляет старых и добавляет нового)
        // await existingProduct.setManufacturers([productManufacturer], {
        //   transaction,
        // });
      }

      // Обработка удаления изображений
      if (productData.images_to_delete) {
        const imagesToDelete = JSON.parse(
          productData.images_to_delete as string
        );

        for (const imageId of imagesToDelete) {
          const image = await ProductImageModel.findByPk(imageId, {
            transaction,
          });
          if (image) {
            // Удаляем файл из файловой системы
            const seperatUrl = image.dataValues.url.split("/");
            const filename = seperatUrl[seperatUrl.length - 1];
            const pathFile = join(process.cwd(), "uploads", "images", filename);

            if (existsSync(pathFile)) {
              await unlink(pathFile);
            }

            // Удаляем запись из базы данных
            await ProductImageModel.destroy({
              where: { id: imageId },
              transaction,
            });
          }
        }
      }

      // Добавление новых изображений
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        const images = (req.files as Express.Multer.File[]).map((file) => ({
          url: `${process.env.SERVER_URL}/product/image/${file.filename}`,
          size: file.size,
          product_id: Number(id),
        }));

        await ProductImageModel.bulkCreate(images, {
          transaction,
        });
      }

      // Отправка уведомления в телеграм (если включено)
      if (productData.telegram_notification) {
        const telegramGroups: Array<TelegramGroupModel> =
          await TelegramGroupModel.findAll({ transaction });

        if (telegramGroups.length > 0) {
          const telegramGroup: TelegramGroupModel = telegramGroups[0];

          // Получаем обновленный товар с полными данными
          const updatedProduct = await ProductModel.findByPk(id, {
            include: [
              {
                model: ProductCategoryModel,
                as: "categories",
                through: { attributes: [] },
              },
              {
                model: ProductManufacturerModel,
                as: "manufacturers",
                through: { attributes: [] },
              },
              {
                model: ProductImageModel,
                as: "images",
              },
            ],
            transaction,
          });

          if (updatedProduct) {
            const category = updatedProduct.dataValues.categories?.[0];
            const manufacturer = updatedProduct.dataValues.manufacturers?.[0];
            const images = updatedProduct.dataValues.images || [];

            const categoryName = category?.name?.replace(/\s/g, "") || "";
            const manufacturerName =
              manufacturer?.name?.replace(/\s/g, "") || "";

            const message =
              `🔄 *Товар обновлен!* #${categoryName} #${manufacturerName} \n\n` +
              `📦 *Название:* ${updatedProduct.dataValues.name}\n` +
              `💰 *Цена:* ${updatedProduct.dataValues.price} руб.\n\n` +
              `📝 *Описание:*\n ${
                updatedProduct.dataValues.description || "Нет описания"
              }\n\n`;

            const keyboard = {
              inline_keyboard: [
                [
                  {
                    text: "✅ Посмотреть товар",
                    url: `${process.env.CLIENT_URL}/product/${id}`,
                  },
                ],
              ],
            };

            let telegramResult;

            if (images.length > 0) {
              if (images.length === 1) {
                telegramResult = await telegram.sendPhotoWithCaption(
                  Number(telegramGroup.dataValues.chat_id),
                  images[0].url,
                  message,
                  keyboard
                );
              } else {
                const media = images.map((image: any, index: number) => ({
                  type: "photo",
                  media: image.url,
                  caption: index === 0 ? message : undefined,
                  parse_mode: "Markdown",
                }));

                telegramResult = await telegram.sendMediaGroup(
                  Number(telegramGroup.dataValues.chat_id),
                  media
                );

                if (telegramResult.ok) {
                  const buttonsMessage = `Для деталей нажмите кнопку ниже 👇`;
                  await telegram.sendMessageWithInlineKeyboard(
                    Number(telegramGroup.dataValues.chat_id),
                    buttonsMessage,
                    keyboard
                  );
                }
              }
            } else {
              telegramResult = await telegram.sendMessageWithInlineKeyboard(
                Number(telegramGroup.dataValues.chat_id),
                message,
                keyboard
              );
            }
          }
        }
      }

      await transaction.commit();

      // Получаем обновленный товар с полными данными для ответа
      const updatedProduct = await ProductModel.findByPk(id, {
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
      });

      res.status(200).send({
        message: "Товар успешно обновлен",
        data: updatedProduct?.dataValues,
      });
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

    if (search) {
      const products = await ProductModel.findAll({
        where: {
          name: { [Op.like]: `%${search}%` },
        },
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
      });
      return res.status(200).send({
        data: products,
        count: products.length,
        page: Number(page),
        totalPages: Math.ceil(products.length / Number(limit)),
      });
    }

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

      return res.status(200).send({
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

// productRoute.delete("/:id", async (req: Request, res: Response) => {
//   const transaction = await sequelizePOSTGRES.transaction();
//   let copyFiles: Array<{ path: string; data: Buffer }> = [];
//   try {
//     const { id } = req.params;
//     const existsProduct = await ProductModel.findByPk(id);
//     if (!existsProduct)
//       return res.status(404).send({ message: "Товар не найден" });

//     const imagesProduct = await ProductImageModel.findAll({
//       where: { product_id: id },
//     });

//     for (const image of imagesProduct) {
//       const seperatUrl = image.dataValues.url.split("/");
//       const filename = seperatUrl[seperatUrl.length - 1];
//       const pathFile = join(process.cwd(), "uploads", "images", filename);
//       const existsFile = existsSync(pathFile);

//       if (existsFile) {
//         const copyFile: Buffer = await readFile(pathFile);
//         copyFiles.push({
//           path: pathFile,
//           data: copyFile,
//         });
//         await unlink(pathFile);
//         await ProductImageModel.destroy({ where: { id: image.dataValues.id } });
//       } else {
//         await ProductImageModel.destroy({ where: { id: image.dataValues.id } });
//       }
//     }
//     copyFiles = [];

//     await ProductModel.destroy({ where: { id: id } });
//     res.status(200).send({ message: "Товар удален" });
//   } catch (error) {
//     await transaction.rollback();
//     for (const file of copyFiles) {
//       await writeFile(file.path, file.data);
//     }
//     handleControllerError(req.baseUrl, error, res);
//   }
// });

productRoute.delete("/:id", async (req: Request, res: Response) => {
  let transaction: Transaction | null = null;
  let copyFiles: Array<{ path: string; data: Buffer }> = [];

  try {
    const { id } = req.params;

    const existsProduct = await ProductModel.findByPk(id);
    if (!existsProduct)
      return res.status(404).send({ message: "Товар не найден" });

    transaction = await sequelizePOSTGRES.transaction();

    const imagesProduct = await ProductImageModel.findAll({
      where: { product_id: id },
      transaction,
    });

    const fileOperations = imagesProduct.map(async (image) => {
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
      }

      await ProductImageModel.destroy({
        where: { id: image.dataValues.id },
        transaction,
      });
    });

    await Promise.all(fileOperations);

    await ProductModel.destroy({
      where: { id: id },
      transaction,
    });

    await transaction.commit();

    copyFiles = [];

    res.status(200).send({ message: "Товар удален" });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    if (copyFiles.length > 0) {
      try {
        const restoreOperations = copyFiles.map(async (file) => {
          await writeFile(file.path, file.data);
        });
        await Promise.all(restoreOperations);
      } catch (restoreError) {
        console.error("File restore failed:", restoreError);
      }
    }

    await sequelizePOSTGRES.connectionManager.close();

    handleControllerError(req.baseUrl, error, res);
  } finally {
    copyFiles = [];
  }
});

export default productRoute;

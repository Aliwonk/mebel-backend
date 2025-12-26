import { json, Router, Response, Request } from "express";
import ProductCatalogModel from "../../models/Catalogs.model";
import { handleControllerError } from "../../../../utils/error.utils";
import TelegramAPI from "../../../../utils/telegramAPI.util";
import ProductCategoryModel from "../../models/Category.model";
import { Guard } from "../../../../utils/security.util";

const productCatalogRoute = Router();
const telegram = new TelegramAPI(
  "8463226469:AAHjMi20nljog9DASopekM4_DNzap433hkU"
);

productCatalogRoute.post(
  "/",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { body } = req;
      await ProductCatalogModel.create({
        name: body.name,
      });
      res.status(201).send({ message: "Каталог создан" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productCatalogRoute.put(
  "/:id",
  json(),
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { body, params } = req;
      const existsCatalog = await ProductCatalogModel.findByPk(params.id);
      if (!existsCatalog)
        return res.status(404).send({ message: "Каталог не найден" });

      await ProductCatalogModel.update(
        { name: body.name },
        {
          where: { id: params.id },
        }
      );
      res.status(200).send({ message: "Данные изменены" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productCatalogRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, all = false } = req.query;
    const offset: number = (Number(page) - 1) * Number(limit);

    if (all) {
      const catalogs = await ProductCatalogModel.findAll({
        include: [
          {
            model: ProductCategoryModel,
            as: "categories",
            through: { attributes: [] },
          },
        ],
      });
      return res.status(200).send({ data: catalogs, count: catalogs.length });
    } else {
      const catalogs = await ProductCatalogModel.findAndCountAll({
        include: [
          {
            model: ProductCategoryModel,
            as: "categories",
            through: { attributes: [] },
          },
        ],
        distinct: true,
        offset,
        limit: Number(limit),
      });
      return res.status(200).send({
        data: catalogs.rows,
        count: catalogs.count,
        page: Number(page),
        totalPages: Math.ceil(catalogs.count / Number(limit)),
      });
    }
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productCatalogRoute.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const catalog = await ProductCatalogModel.findByPk(id);

    if (!catalog) return res.status(404).send({ message: "Каталог не найден" });

    res.status(200).send({ data: catalog.dataValues });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productCatalogRoute.delete(
  "/:id",
  Guard,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existsCatalog = await ProductCatalogModel.findByPk(id);
      if (!existsCatalog)
        return res.status(404).send({ message: "Каталог не найден" });

      await ProductCatalogModel.destroy({ where: { id } });
      res.status(200).send({ message: "Каталог удален" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

export default productCatalogRoute;

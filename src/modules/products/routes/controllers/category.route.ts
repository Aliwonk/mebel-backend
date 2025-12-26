import { json, Router, Request, Response } from "express";
import ProductCatalogModel from "../../models/Catalogs.model";
import ProductCategoryModel from "../../models/Category.model";
import { handleControllerError } from "../../../../utils/error.utils";
import { Guard } from "../../../../utils/security.util";

const productCategoryRoute = Router();

productCategoryRoute.post("/", json(), Guard, async (req: Request, res: Response) => {
  try {
    const { body } = req;
    const existsCatalog = await ProductCatalogModel.findByPk(body.catalog_id);
    if (!existsCatalog)
      return res.status(404).send({ message: "Каталог не найден" });

    await ProductCategoryModel.create({
      name: body.name,
      catalog_id: existsCatalog.dataValues.id,
    });

    res.status(201).send({ message: "Категория создан" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productCategoryRoute.put(
  "/:id",
  Guard,
  json(),
  async (req: Request, res: Response) => {
    try {
      const { body, params } = req;
      const existsCategory = await ProductCategoryModel.findByPk(params.id);
      if (!existsCategory)
        return res.status(404).send({ message: "Категория не найдена" });

      await ProductCategoryModel.update(
        { name: body.name },
        { where: { id: params.id } }
      );

      res.status(200).send({ message: "Категория изменена" });
    } catch (error) {
      handleControllerError(req.baseUrl, req, res);
    }
  }
);

productCategoryRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, all = false } = req.query;
    const offset: number = (Number(page) - 1) * Number(limit);

    if (all) {
      const categories = await ProductCategoryModel.findAll();
      res.status(200).send({ data: categories, count: categories.length });
    } else {
      const categories = await ProductCategoryModel.findAndCountAll({
        limit: Number(limit),
        offset,
      });
      res.status(200).send({
        data: categories.rows,
        count: categories.count,
        page: Number(page),
        totalPages: Math.ceil(categories.count / Number(limit)),
      });
    }
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productCategoryRoute.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await ProductCategoryModel.findByPk(id, {
      include: [
        {
          model: ProductCatalogModel,
          as: "catalog",
          attributes: { include: ["name", "id"] },
        },
      ],
      attributes: { exclude: ["catalog_id"] },
    });
    if (!category)
      return res.status(404).send({ message: "Категория не найдена" });

    res.status(200).send({ data: category.dataValues });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productCategoryRoute.delete("/:id", Guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existsCategory = await ProductCategoryModel.findByPk(id);
    if (!existsCategory)
      return res.status(404).send({ message: "Категория не найдена" });

    await ProductCategoryModel.destroy({ where: { id } });
    res.status(200).send({ message: "Категория удалена" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default productCategoryRoute;

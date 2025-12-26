import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../../utils/error.utils";
import ProductManufacturerModel from "../../models/Manufacturers.model";
import { Guard } from "../../../../utils/security.util";

const productManufacturerRoute = Router();

productManufacturerRoute.post(
  "/",
  Guard,
  json(),
  async (req: Request, res: Response) => {
    try {
      const { body } = req;
      await ProductManufacturerModel.create({
        name: body.name,
      });
      res.status(201).send({ message: "Производитель создан" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productManufacturerRoute.put(
  "/:id",
  Guard,
  json(),
  async (req: Request, res: Response) => {
    try {
      const { body, params } = req;
      const existsManufacturer = await ProductManufacturerModel.findByPk(
        params.id
      );

      if (!existsManufacturer) {
        return res.status(404).send({ message: "Производитель не найден" });
      }

      await ProductManufacturerModel.update(
        { name: body.name },
        { where: { id: params.id } }
      );

      res.status(200).send({ message: "Данные производителя изменены" });
    } catch (error) {
      handleControllerError(req.baseUrl, error, res);
    }
  }
);

productManufacturerRoute.get("/all", async (req: Request, res: Response) => {
  try {
    const { page, limit, all = false } = req.query;

    if (all) {
      const manufacturers = await ProductManufacturerModel.findAll();
      return res.status(200).send({
        data: manufacturers,
        count: manufacturers.length,
      });
    } else {
      const currentPage = Number(page) || 1;
      const pageSize = Number(limit) || 10;
      const offset = (currentPage - 1) * pageSize;

      const manufacturers = await ProductManufacturerModel.findAndCountAll({
        offset,
        limit: pageSize,
      });

      return res.status(200).send({
        data: manufacturers.rows,
        count: manufacturers.count,
        page: currentPage,
        totalPages: Math.ceil(manufacturers.count / pageSize),
      });
    }
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productManufacturerRoute.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const manufacturer = await ProductManufacturerModel.findByPk(id);

    if (!manufacturer) {
      return res.status(404).send({ message: "Производитель не найден" });
    }

    res.status(200).send({ data: manufacturer.dataValues });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

productManufacturerRoute.delete("/:id", Guard, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existsManufacturer = await ProductManufacturerModel.findByPk(id);

    if (!existsManufacturer) {
      return res.status(404).send({ message: "Производитель не найден" });
    }

    await ProductManufacturerModel.destroy({ where: { id } });

    res.status(200).send({ message: "Производитель удален" });
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default productManufacturerRoute;

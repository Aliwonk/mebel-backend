import { json, Router, Request, Response } from "express";
import { handleControllerError } from "../../../../utils/error.utils";
import { diskStorage } from "multer";
import ProductModel from "../../models/Products.model";
import { Guard } from "../../../../utils/security.util";

const productDimensionRoute = Router();

productDimensionRoute.post("/", json(), Guard, async (req: Request, res: Response) => {
  try {
    const { body } = req;
    // const existProduct = await ProductModel.findByPk(body.product_id);
    // if (!existProduct)
    //   return res.status(404).send({ message: "Товар не найден" });


    console.log(body);
  } catch (error) {
    handleControllerError(req.baseUrl, error, res);
  }
});

export default productDimensionRoute;

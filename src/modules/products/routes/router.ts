import { Router } from "express";
import productRoute from "./controllers/product.route";
import productCategoryRoute from "./controllers/category.route";
import productCatalogRoute from "./controllers/catalog.route";
import productManufacturerRoute from "./controllers/manufacturer.route";
import productDimensionRoute from "./controllers/dimension.route";
import productImageRoute from "./controllers/image.route";

const productRouter = Router();

productRouter.use("/", productRoute);
productRouter.use("/catalog", productCatalogRoute);
productRouter.use("/category", productCategoryRoute);
productRouter.use("/manufacturer", productManufacturerRoute);
productRouter.use("/dimension", productDimensionRoute);
productRouter.use("/image", productImageRoute);

export default productRouter;

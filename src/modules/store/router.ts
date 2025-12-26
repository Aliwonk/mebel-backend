import { Router } from "express";
import storeInfoRoute from "./routes/info.route";
import storeImageRoute from "./routes/image.route";
import storeEmailRoute from "./routes/email.route";
import storeAddressRoute from "./routes/address.route";
import storePhoneRoute from "./routes/phone.route";

const storeRouter = Router();

storeRouter.use("/info", storeInfoRoute);
storeRouter.use("/email", storeEmailRoute);
storeRouter.use("/address", storeAddressRoute);
storeRouter.use("/phone", storePhoneRoute);
storeRouter.use("/image", storeImageRoute);

export default storeRouter;

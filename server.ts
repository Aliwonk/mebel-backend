import * as express from "express";
import sequelizePOSTGRES from "./src/configs/db.config";
import { configDotenv } from "dotenv";
import configRouter from "./src/configs/router.config";
import * as cors from "cors";

configDotenv({ quiet: true });
const server = express();

server.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mebelmodnostilno.ru",
      "https://admin.mebelmodnostilno.ru",
    ],
  })
);
server.use("/api", configRouter);
server.use(express.urlencoded({ extended: true }));

sequelizePOSTGRES
  .sync({ force: false, alter: true })
  .then(() => {
    console.log("ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ УСПЕШНО");
    server.listen(process.env.PORT, () => {
      console.log(
        `СЕРВЕР ДОСТУПЕН ПО АДРЕСУ: ${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log(`ОШИБКА ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ: ${error}`);
  });

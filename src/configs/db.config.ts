import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";

configDotenv({ quiet: true });
const sequelizePOSTGRES = new Sequelize({
  database: process.env.POSTGRES_DB_NAME,
  host: process.env.POSTGRES_DB_HOST,
  port: Number(process.env.POSTGRES_DB_PORT),
  username: process.env.POSTGRES_DB_USERNAME,
  password: process.env.POSTGRES_DB_PASSWORD,
  dialect: "postgres",
  logging: false,
});

export default sequelizePOSTGRES;

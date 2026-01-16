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
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

export default sequelizePOSTGRES;

import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class StoreModel extends Model {
  public id!: number;
  public name!: string;
  public description!: string;
  public url_logo!: string;
}

StoreModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Название магазина не может быть пустой строкой" },
        notNull: { msg: "Название магазина не может быть пустой" },
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    url_logo: {
      type: DataTypes.STRING(500),
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "stores" }
);

export default StoreModel;

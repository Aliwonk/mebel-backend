import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class StoreImageModel extends Model {
  public id!: number;
  public url!: string;
  public size!: number;
}

StoreImageModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "URL картинки не можеты быть пустой строкой" },
        notNull: { msg: "URL картинки не можеты быть пустой" },
      },
    },
    size: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "store_images" }
);

export default StoreImageModel;

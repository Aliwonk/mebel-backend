import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class ProductModel extends Model {
  public id!: number;
  public name!: string;
  public price!: number;
  public quantity!: number;
}

ProductModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Название товара не может быть пустой строкой" },
        notNull: { msg: "Название товара не может быть пустой" },
      },
    },
    price: {
      type: DataTypes.DECIMAL(19, 2),
      allowNull: false,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "products" }
);

export default ProductModel;

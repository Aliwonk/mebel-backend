import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductModel from "./Products.model";

class ProductColorModel extends Model {}

ProductColorModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Название цвета не может быть пустой строкой" },
        notNull: { msg: "Название цвета не может быть пустым" },
      },
    },
    hex: {
      type: DataTypes.STRING(7),
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "product_colors" }
);

ProductColorModel.belongsTo(ProductModel, {
  foreignKey: "product_id",
  as: "product",
  onDelete: "CASCADE",
});

ProductModel.hasMany(ProductColorModel, {
  foreignKey: "product_id",
  as: "colors",
  onDelete: "CASCADE",
});

export default ProductColorModel;

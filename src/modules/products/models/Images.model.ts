import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductModel from "./Products.model";

class ProductImageModel extends Model {}

ProductImageModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: { msg: "URL картинки не может быть пустой строкой" },
        notNull: { msg: "URL картинки не может быть пустой" },
      },
    },
    size: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    color_id: {
      type: DataTypes.INTEGER,
      validate: {
        isNumeric: { msg: "Идентификатор картинки должен быть тип номер" },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "product_images" }
);

ProductImageModel.belongsTo(ProductModel, {
  foreignKey: "product_id",
  as: "product",
  onDelete: "CASCADE",
});

ProductModel.hasMany(ProductImageModel, {
  foreignKey: "product_id",
  as: "images",
  onDelete: "CASCADE",
});

export default ProductImageModel;

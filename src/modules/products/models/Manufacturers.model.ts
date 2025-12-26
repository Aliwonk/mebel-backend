import { BelongsToManyAddAssociationMixin, DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductModel from "./Products.model";

class ProductManufacturerModel extends Model {
  public id!: number;
  public name!: string;

  public products?: ProductModel[];

  public addProduct!: BelongsToManyAddAssociationMixin<ProductModel, number>;
}

ProductManufacturerModel.init(
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
        notEmpty: {
          msg: "Название производителя не может быть пустой строкой",
        },
        notNull: {
          msg: "Название производителя не может быть пустой",
        },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "product_manufacturers" }
);

// СВЯЗИ

ProductManufacturerModel.belongsToMany(ProductModel, {
  through: "product_mtm_manufacturer",
  foreignKey: "manufacturer_id",
  as: "products",
});

ProductModel.belongsToMany(ProductManufacturerModel, {
  through: "product_mtm_manufacturer",
  foreignKey: "product_id",
  as: "manufacturers",
});

export default ProductManufacturerModel;

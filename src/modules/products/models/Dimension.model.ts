import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductModel from "./Products.model";

class ProductDimensionModel extends Model {
  public id!: number;
  public length!: number;
  public width!: number;
  public height!: number;
  public weight!: number;
  public depth!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly product?: ProductModel;
}

ProductDimensionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    length: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    width: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    depth: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "product_dimensions" }
);

// СВЯЗИ

ProductDimensionModel.belongsTo(ProductModel, {
  foreignKey: "product_id",
  as: "product",
  onDelete: "CASCADE",
});

ProductModel.hasMany(ProductDimensionModel, {
  foreignKey: "product_id",
  as: "dimensions",
  onDelete: "CASCADE",
});

export default ProductDimensionModel;

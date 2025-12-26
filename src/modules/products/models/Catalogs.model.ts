import { BelongsToManyAddAssociationMixin, DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductCategoryModel from "./Category.model";

class ProductCatalogModel extends Model {
  public id!: number;
  public name!: string;

  public addCategory!: BelongsToManyAddAssociationMixin<
    ProductCategoryModel,
    number
  >;

  public categories?: ProductCategoryModel[];
}

ProductCatalogModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Название каталога не может быть пустой строкой" },
        notNull: { msg: "Название каталога не может быть пустой" },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "product_catalogs" }
);

// СВЯЗИ

ProductCatalogModel.belongsToMany(ProductCategoryModel, {
  through: "catalog_mtm_category",
  foreignKey: "catalog_id",
  as: "categories",
});

ProductCategoryModel.belongsToMany(ProductCatalogModel, {
  through: "catalog_mtm_category",
  foreignKey: "category_id",
  as: "catalogs",
});

export default ProductCatalogModel;

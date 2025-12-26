import { BelongsToManyAddAssociationMixin, DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";
import ProductModel from "./Products.model";
import ProductCatalogModel from "./Catalogs.model";

class ProductCategoryModel extends Model {
  public id!: number;
  public name!: string;

  public catalogs?: ProductCatalogModel[];
  public products?: ProductModel[];

  public addCatalog!: BelongsToManyAddAssociationMixin<
    ProductCatalogModel,
    number
  >;
  public addProduct!: BelongsToManyAddAssociationMixin<ProductModel, number>;
}

ProductCategoryModel.init(
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
  { sequelize: sequelizePOSTGRES, modelName: "product_categories" }
);

// СВЯЗИ

ProductCategoryModel.belongsToMany(ProductModel, {
  through: "product_mtm_category",
  foreignKey: "category_id",
  as: "products",
});

ProductModel.belongsToMany(ProductCategoryModel, {
  through: "product_mtm_category",
  foreignKey: "product_id",
  as: "categories",
});

export default ProductCategoryModel;

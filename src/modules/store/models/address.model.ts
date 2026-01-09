import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class StoreAddressModel extends Model {
  public id!: number;
  public address!: string;
  public hours!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StoreAddressModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    address: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Адрес не может быть пустой строкой" },
        notNull: { msg: "Адрес не может быть пустым" },
      },
    },
    hours: {
      type: DataTypes.STRING(250),
      validate: {
        notEmpty: { msg: "Часы работы не может быть пустой строкой" },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "store_addresses" }
);
export default StoreAddressModel;

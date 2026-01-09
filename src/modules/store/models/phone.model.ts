import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class StorePhoneModel extends Model {
  public id!: number;
  public phone!: string;
  public name!: string;
  public isMain!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StorePhoneModel.init(
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
        notEmpty: { msg: "Название телефона не может быть пустой строкой" },
        notNull: { msg: "Название телефона не может быть пустым" },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Телефон не может быть пустой строкой" },
        notNull: { msg: "Телефон не может быть пустым" },
      },
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "store_phones" }
);

export default StorePhoneModel;

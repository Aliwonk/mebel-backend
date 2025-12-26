import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class StoreEmailModel extends Model {
  public id!: number;
  public email!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StoreEmailModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Email должен быть корректным" },
        notEmpty: { msg: "Email не может быть пустой строкой" },
        notNull: { msg: "Email не может быть пустым" },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "store_emails" }
);

export default StoreEmailModel;

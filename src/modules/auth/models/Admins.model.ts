import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class AdminModel extends Model {
  public id!: number;
  public login!: string;
  public hash_password!: Buffer;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    surname: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Фамилия не может быть пустой строкой" },
        notNull: { msg: "Фамилия не может быть пустой" },
      },
    },
    name: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Фамилия не может быть пустой строкой" },
        notNull: { msg: "Фамилия не может быть пустой" },
      },
    },
    login: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    hash_password: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "admins" }
);

export default AdminModel;

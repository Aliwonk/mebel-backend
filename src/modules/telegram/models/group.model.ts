import { DataTypes, Model } from "sequelize";
import sequelizePOSTGRES from "../../../configs/db.config";

class TelegramGroupModel extends Model {}

TelegramGroupModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chat_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        isNumeric: { msg: "" },
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Название не может быть пустой строкой" },
        notNull: { msg: "Название не может быть пустым" },
      },
    },
  },
  { sequelize: sequelizePOSTGRES, modelName: "telegram_groups", timestamps: false }
);

export default TelegramGroupModel;

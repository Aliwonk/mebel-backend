import { diskStorage } from "multer";
import { Request } from "express";
import { join } from "path";
import { mkdir, readdir } from "fs/promises";
import { existsSync, readdirSync, statSync } from "fs";

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",
];

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: any
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error(
        `Недопустимый тип файла. Разрешены только: ${allowedMimeTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
};

const generateUniqueFileName = (file: Express.Multer.File): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const originalName = file.originalname.replace(/\s+/g, "-");
  const extension = originalName.split(".").pop();
  const nameWithoutExtension = originalName.substring(
    0,
    originalName.lastIndexOf(".")
  );

  let fileExtension = extension || "";
  if (!fileExtension) {
    switch (file.mimetype) {
      case "image/jpeg":
      case "image/jpg":
        fileExtension = "jpg";
        break;
      case "image/png":
        fileExtension = "png";
        break;
      case "image/gif":
        fileExtension = "gif";
        break;
      default:
        fileExtension = "bin";
    }
  }

  return `${timestamp}_${randomString}.${fileExtension}`;
};

const storageImage = diskStorage({
  destination: async (req: Request, file: Express.Multer.File, cb) => {
    try {
      const path = join(process.cwd(), "uploads", "images");
      const existsDirectory = existsSync(path);
      if (!existsDirectory) await mkdir(path, { recursive: true });
      cb(null, path);
    } catch (error) {
      console.error("Ошибка при создании директории: ", error);
      cb(error as Error, "");
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    try {
      const uniqueFileName = generateUniqueFileName(file);
      cb(null, uniqueFileName);
    } catch (error) {
      console.error("Ошибка при генерации имени файла: ", error);
      cb(error as Error, "");
    }
  },
});

export { storageImage, imageFileFilter };

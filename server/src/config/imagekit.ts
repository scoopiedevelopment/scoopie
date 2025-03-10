import ImageKit from "imagekit";
import config from "./config";

export const imagekit = new ImageKit({
  publicKey: config.IMAGE_KIT.PUBLICKEY!,
  privateKey: config.IMAGE_KIT.PRIVATEKEY!,
  urlEndpoint: config.IMAGE_KIT.URLENDPOINT!,
});

export async function uploadToImageKit(file: Express.Multer.File) {
  return imagekit.upload({
    file: file.buffer,
    fileName: file.originalname,
    folder: "/uploads/",
  });
  }
  
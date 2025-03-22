import { NextFunction, Request, Response } from "express";
import httpError from "../../util/httpError";
import { uploadToImageKit } from "../../config/imagekit";
import responseMessage from "../../constant/responseMessage";
import httpResponse from "../../util/httpResponse";



export default {
    uploadProfilePic: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(!req.file) {
                return httpError(next, new Error("Only one file is allowed."), req, 500);
            }

            const uploadedFiles = await uploadToImageKit(req.file);
            const responseBody = {
                url: uploadedFiles.url
            }
            httpResponse(req, res, 200, responseMessage.SUCCESS, responseBody);
            
        } catch (error) {
            console.error("Error in uploading file.", error);
            httpError(next, error, req, 500);
        }
    },
    uploadPost: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(!req.files || req.files.length === 0) {
                return
            }
            console.log(req.files);
            
            const files = req.files as Express.Multer.File[];
            const uploadedFiles = await Promise.all(
                files.map((file) => uploadToImageKit(file))
            )
            console.log(uploadedFiles);
            
            const responseBody = {
                urls: uploadedFiles.map((file) => (file.url))
            }
            httpResponse(req, res, 200, responseMessage.SUCCESS, responseBody);
            
        } catch (error) {
            console.error("Error in uploading file.", error);
            httpError(next, error, req, 500);
        }
    },
    uploadClip: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if(!req.file) {
                return httpError(next, new Error("Only one file is allowed."), req, 500);
            }

            const uploadedFiles = await uploadToImageKit(req.file);
            const responseBody = {
                url: uploadedFiles.url
            }
            httpResponse(req, res, 200, responseMessage.SUCCESS, responseBody);
        } catch (error) {
            console.error("Error in uploading clip.", error);
            httpError(next, error, req, 500);
        }
    }
}
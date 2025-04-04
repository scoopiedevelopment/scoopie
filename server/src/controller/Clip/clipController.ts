import { NextFunction, Request, Response } from "express";
import httpError from "../../util/httpError";
import { checkVideoForNSFW } from "../../config/sightEngine";
import { prisma } from "../../util/prisma";
import { User } from "../Authentication/types";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { isValidObjectId } from "mongoose";



export default {
    createClip: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { url, text } = req.body;
            const user = req.user as User;
            const moderationResult = await checkVideoForNSFW(url);

            if( moderationResult?.nudity > 0.7 && moderationResult?.violence > 0.7) {
                return httpError(next, new Error("Not an appropriate content."), req, 400);
            }

            await prisma.clip.create({
                data: {
                    video: url,
                    text,
                    userId: user.userId
                }
            })

            return httpResponse(req, res, 201, responseMessage.SUCCESS, null)

        } catch (error) {
            console.error("Error in creating clip.", error);
            httpError(next, error, req, 500);
        }
    },
    getClipById: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { clipId } = req.params;

            const clip = await prisma.clip.findFirst({
                where: {
                    id: clipId
                },
                include: {
                    user: {
                        select: {
                            profilePic: true,
                            username: true,
                            userId: true
                        }
                    }
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, clip);

        } catch (error) {
            console.error("Error in fetching clip by Id.", error);
            httpError(next, error, req, 500);
        }
    },
    getUserClips: async (req: Request, res: Response, next: NextFunction) => {

        try {

            const { userId, page } = req.params;
            let parshedPage = parseInt(page || "1") - 1;

            if(!userId) {
                return httpError(next, new Error("No user Id is provided."), req, 400)
            }

            if(!isValidObjectId(userId)) {
                return httpError(next, new Error("Invalid userId."), req, 400);
            }

            const clips = await prisma.clip.findMany({
                where: {
                    userId: userId
                },
                skip: parshedPage * 20,
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, clips)
        } catch (error) {
            console.error("Error in fetching clips.", error);
            httpError(next, error, req, 500);
        }
    },
    deleteClip: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { clipId } = req.params;
            const user = req.user as User;

            await prisma.clip.delete({
                where: {
                    id: clipId,
                    userId: user.userId
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, null);
        } catch (error) {
            console.error("Error in deleting clip.", error);
            httpError(next, error, req, 500);
        }
    }
}
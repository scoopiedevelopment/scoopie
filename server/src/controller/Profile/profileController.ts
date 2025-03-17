import { NextFunction, Request, Response } from "express";
import { prisma } from "../../util/prisma";
import httpError from "../../util/httpError";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { User } from "../Authentication/types";


export default {
    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
        
            const {
                username,
                name,
                bio,
                dateofBirth,
                website,
                profilePic,
                type
            } = req.body;

            const user = req.user as User;

            const updateData: Record<string, any> = {};
            if (username !== undefined) updateData.username = username;
            if (name !== undefined) updateData.name = name;
            if (bio !== undefined) updateData.bio = bio;
            if (dateofBirth !== undefined) updateData.dateofBirth = dateofBirth;
            if (website !== undefined) updateData.website = website;
            if (profilePic !== undefined) updateData.profilePic = profilePic;
            if (type !== undefined) updateData.type = type;


            await prisma.profile.update({
                where: { userId: user.userId },
                data: updateData,
            });

            return httpResponse(req, res, 200, responseMessage.SUCCESS, null);

        } catch (error) {
            console.error("Error in updating profile.", error);
            httpError(next, error, req, 500);
        }
    },
    delete: async (req: Request, res:Response, next:NextFunction) => {

        try {
            const user = req.user as User;

            await prisma.user.delete({
                where: {
                    id: user.userId
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, null);

        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getProfile: async (req: Request, res:Response, next:NextFunction) => {

        try {
            const user = req.user as User;

            const profile = await prisma.user.findUnique({
                where: {
                    id: user.userId
                },
                select: {
                    email: true,
                    profile: true
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, profile);

        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
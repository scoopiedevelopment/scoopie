import { NextFunction, Request, Response } from "express";
import { prisma } from "../../util/prisma";
import httpResponse from "../../util/httpResponse";
import httpError from "../../util/httpError";
import { User } from "../Authentication/types";




export default {
    saveFcm: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, deviceInfo } = req.body;
            const { userId } = req.user as User;

            await prisma.fcmToken.create({
                data: {
                    userId,
                    token,
                    deviceInfo
                }
            });

            httpResponse(req, res, 200, 'Fcm token saved successfully', null);

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    getNotifications: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;

            const notifications = await prisma.notification.findMany({
                where: {
                    userId,
                    isRead: false
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            httpResponse(req, res, 200, 'Notifications fetched successfully', notifications);

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    markRead: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;

            await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });

            httpResponse(req, res, 200, 'Notifications marked as read successfully', null);

        } catch (error) {
            httpError(next, error, req, 500);
        }
    }
}
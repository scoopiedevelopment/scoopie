import { NextFunction, Request, Response } from 'express';
import httpError from '../../util/httpError';
import { User } from '../Authentication/types';
import { prisma } from '../../util/prisma';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import { UploadStoryType } from './types';

export default {
    createStory: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;
            const {
                mediaUrl,
                mediaType
            } = req.body as UploadStoryType;

            await prisma.story.create({
                data: {
                    mediaUrl,
                    mediaType,
                    userId,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            // console.error("Error in creating Story.", error);
            httpError(next, error, req, 500);
        }
    },
    getStories: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { userId } = req.user as User;
            const { page = 1 } = req.query;
            const limit = 20;

            const following = await prisma.profile.findUnique({
                where: {
                    userId: userId,
                },
                select: {
                    following: {
                        select: {
                            followingId: true,
                        },
                    },
                },
            });
            const followingIds = following?.following.map((f) => f.followingId) || [];
            followingIds.push(userId);
            const stories = await prisma.profile.findMany({
                where: {
                    userId: {
                        in: followingIds,
                    },
                },
                select: {
                    userId: true,
                    stories: {
                        where: {
                            expiresAt: {
                                gte: new Date(),
                            },
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                        take: limit,
                    },
                },
                skip: (Number(page) - 1) * limit,
                take: limit,
            });
            httpResponse(req, res, 200, responseMessage.SUCCESS, stories);

        } catch (error) {
            // console.error("Error in getting Stories.", error);
            httpError(next, error, req, 500);
            
        }
    }
}
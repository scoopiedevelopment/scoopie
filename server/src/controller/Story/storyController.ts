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
            const { page = 1, limit = 10 } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const following = await prisma.profile.findUnique({
                where: {
                    userId: userId,
                },
                select: {
                    following: {
                        where: {
                            status: 'Accepted'
                        },
                        select: {
                            followingId: true,
                        },
                    },
                },
            });

            const followingIds = following?.following.map((f) => f.followingId) || [];
            followingIds.push(userId);

            const [usersWithStories, totalUsersWithStories] = await Promise.all([
                prisma.profile.findMany({
                    where: {
                        userId: {
                            in: followingIds,
                        },
                        stories: {
                            some: {
                                expiresAt: {
                                    gte: new Date(),
                                },
                            },
                        },
                    },
                    select: {
                        userId: true,
                        username: true,
                        profilePic: true,
                        stories: {
                            where: {
                                expiresAt: {
                                    gte: new Date(),
                                },
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                    },
                    skip,
                    take: limitNumber,
                }),
                prisma.profile.count({
                    where: {
                        userId: {
                            in: followingIds,
                        },
                        stories: {
                            some: {
                                expiresAt: {
                                    gte: new Date(),
                                },
                            },
                        },
                    },
                })
            ]);

            const filteredUsers = usersWithStories.filter(user => user.stories.length > 0);

            const totalPages = Math.ceil(totalUsersWithStories / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                stories: filteredUsers,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount: totalUsersWithStories,
                    hasNext,
                    hasPrev,
                    limit: limitNumber
                }
            });

        } catch (error) {
            // console.error("Error in getting Stories.", error);
            httpError(next, error, req, 500);
            
        }
    }
}
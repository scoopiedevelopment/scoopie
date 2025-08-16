import { NextFunction, Request, Response } from 'express';
import httpError from '../../util/httpError';
import { checkVideoForNSFW } from '../../config/sightEngine';
import { prisma } from '../../util/prisma';
import { User } from '../Authentication/types';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import { isValidObjectId } from 'mongoose';



export default {
    createClip: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { url, text } = req.body as {
                url: string;
                text: string;
            };
            const user = req.user as User;
            const moderationResult = await checkVideoForNSFW(url);

            if( moderationResult?.nudity > 0.7 && moderationResult?.violence > 0.7) {
                return httpError(next, new Error('Not an appropriate content.'), req, 400);
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
            // console.error("Error in creating clip.", error);
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
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        }
                    }
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, clip);

        } catch (error) {
            // console.error("Error in fetching clip by Id.", error);
            httpError(next, error, req, 500);
        }
    },
    getUserClips: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            const currentUser = req.user as User;
            const { page = 1, limit = 20 } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const targetUserId = userId || currentUser.userId;

            if(!targetUserId || !isValidObjectId(targetUserId)) {
                return httpError(next, new Error('Invalid userId'), req, 400);
            }

            // Check if target user exists and get privacy settings
            const targetUser = await prisma.profile.findFirst({
                where: {
                    userId: targetUserId
                },
                select: {
                    type: true
                }
            });

            if (!targetUser) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            // Privacy check - if private account and not the owner
            if (targetUser.type === 'Private' && targetUserId !== currentUser.userId) {
                const isFollowing = await prisma.follow.findFirst({
                    where: {
                        followerId: currentUser.userId,
                        followingId: targetUserId,
                        status: 'Accepted'
                    }
                });

                if (!isFollowing) {
                    return httpResponse(req, res, 200, responseMessage.SUCCESS, {
                        clips: [],
                        pagination: {
                            currentPage: pageNumber,
                            totalPages: 0,
                            totalCount: 0,
                            hasNext: false,
                            hasPrev: false,
                            limit: limitNumber
                        }
                    });
                }
            }

            const [clips, totalCount] = await Promise.all([
                prisma.clip.findMany({
                    where: {
                        userId: targetUserId,
                        visibility: 'Public'
                    },
                    include: {
                        user: {
                            select: {
                                profilePic: true,
                                username: true,
                                userId: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            }
                        }
                    },
                    skip,
                    take: limitNumber,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.clip.count({
                    where: {
                        userId: targetUserId,
                        visibility: 'Public'
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                clips,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalCount,
                    hasNext,
                    hasPrev,
                    limit: limitNumber
                }
            });

        } catch (error) {
            // console.error("Error in fetching clips.", error);
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
            // console.error("Error in deleting clip.", error);
            httpError(next, error, req, 500);
        }
    }
}
import { NextFunction, Request, Response } from 'express';
import httpError from '../../util/httpError';
import path from 'path';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import { checkImageForNSFW } from '../../config/sightEngine';
import { prisma } from '../../util/prisma';
import { User } from '../Authentication/types';
import { isValidObjectId } from 'mongoose';
import { CreatePostBody } from './types';



export default {

    createPost: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { urls, text } = req.body as CreatePostBody;
            
            const safeFiles = [];
            const user = req.user as User;
    
            if (urls || Array.isArray(urls) || urls.length !== 0 ) {
                
                for (const fileUrl of urls) {
                    const fileExt = path.extname(fileUrl).toLowerCase();
        
                    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt)) {
                        const moderationResult = await checkImageForNSFW(fileUrl);
                        if( moderationResult?.nudity < 0.7 && moderationResult?.violence < 0.7) {
                            safeFiles.push(fileUrl);
                        }
                    } 
                    
                }

                if (urls.length !== 0 && safeFiles.length === 0) {
                    return httpError(next, new Error('All media files were rejected due to NSFW content.'), req, 400);
                }
            }
    
            const profile = await prisma.profile.findFirst({
                where: {
                    userId: user.userId
                }
            })

            if(!profile) {
                return httpError(next, new Error('No associated profile found.'), req, 404);
            }

            await prisma.post.create({
                data: {
                    userId: user.userId,
                    text,
                    media: {
                        create: safeFiles.map((media: string) => ({
                            url: media,
                            type: 'Image'
                        }))
                    }
                }
            });
    
            httpResponse(req, res, 201, responseMessage.SUCCESS, null);
    
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    deletePost: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId } = req.params;
            const user = req.user as User;

            if(!postId) {
                return httpError(next, new Error('No post Id is provided.'), req, 400)
            }

            const post = await prisma.post.delete({
                where: {
                    id: postId,
                    userId: user.userId
                }
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, post);

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    getPostById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId } = req.params;
            
            if(!postId) {
                return httpError(next, new Error('No post Id is provided.'), req, 400)
            }

            const post = await prisma.post.findUnique({
                where: {
                    id: postId
                },
                include: {
                    media: true,
                    user: true
                }
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, post);

        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    getUserPosts: async (req: Request, res: Response, next: NextFunction) => {
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
                        posts: [],
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

            const [posts, totalCount] = await Promise.all([
                prisma.post.findMany({
                    where: {
                        userId: targetUserId,
                        visibility: 'Public'
                    },
                    include: {
                        media: {
                            where: {
                                type: 'Image'
                            }
                        },
                        user: {
                            select: {
                                username: true,
                                profilePic: true,
                                userId: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limitNumber
                }),
                prisma.post.count({
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
                post: posts,
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
            httpError(next, error, req, 500);
        }
    },
    getUserTextPosts: async (req: Request, res: Response, next: NextFunction) => {
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
                        posts: [],
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

            const [posts, totalCount] = await Promise.all([
                prisma.post.findMany({
                    where: {
                        userId: targetUserId,
                        visibility: 'Public',
                        AND: [
                            { text: { not: null } },
                            { text: { not: '' } },
                            {
                                OR: [
                                    { media: { none: {} } },
                                    { media: { every: { type: { notIn: ['Image', 'Video'] } } } }
                                ]
                            }
                        ]
                    },
                    include: {
                        user: {
                            select: {
                                username: true,
                                profilePic: true,
                                userId: true
                            }
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limitNumber
                }),
                prisma.post.count({
                    where: {
                        userId: targetUserId,
                        visibility: 'Public',
                        AND: [
                            { text: { not: null } },
                            { text: { not: '' } },
                            {
                                OR: [
                                    { media: { none: {} } },
                                    { media: { every: { type: { notIn: ['Image', 'Video'] } } } }
                                ]
                            }
                        ]
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                posts,
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
            httpError(next, error, req, 500);
        }
    },
}
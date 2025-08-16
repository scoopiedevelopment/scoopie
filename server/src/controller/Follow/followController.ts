import { NextFunction, Request, Response } from 'express';
import { User } from '../Authentication/types';
import { prisma } from '../../util/prisma';
import httpError from '../../util/httpError';
import httpResponse from '../../util/httpResponse';
import { NotificationType } from '@prisma/client';
import { sendNotification } from '../../util/notification';



export default {
    followUser: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { id } = req.params;
            const { userId } = req.user as User;
            
            if(userId === id) {
                return httpError(next, new Error('You cannot follow yourself'), req, 400);
            };
            
            const response = await prisma.follow.findFirst({
                where: {
                    followerId: userId,
                    followingId: id
                }
            });

            if (response) {
                return httpResponse(req, res, 200, 'Already following this user', response);
            };

            const user = await prisma.profile.findFirst({
                where: {
                    userId: id
                },
                select: {
                    type: true
                }
            });

            if (!user) {
                return httpError(next, new Error('User not found'), req, 404);
            };

            if (user.type === 'Private') {

                const user = await prisma.follow.create({
                    data: {
                        followerId: userId,
                        followingId: id,
                        status: 'Pending'
                    },
                    select: {
                        follower: true
                    }
                });
                
                await prisma.notification.create({
                    data: {
                        userId: id,
                        type: NotificationType.follow,
                        senderId: userId,
                        message: `${user.follower.username} wants to follow you.`
                    }
                })

                return httpResponse(req, res, 200, 'Follow request sent', null);

            } else {
                
                const user = await prisma.follow.create({
                    data: {
                        followerId: userId,
                        followingId: id,
                        status: 'Accepted'
                    },
                    select: {
                        follower: {
                            select: {
                                fcmTokens: true,
                                username: true
                            }
                        }
                    }
                });

                await prisma.notification.create({
                    data: {
                        userId: id,
                        type: NotificationType.follow,
                        senderId: userId,
                        message: `${user.follower.username} followed you.`
                    }
                });

                if(user.follower.fcmTokens.length > 0) {
                    user.follower.fcmTokens.forEach(token => {
                        sendNotification({
                            fcmToken: token.token,
                            title: 'New follower',
                            body: `${user.follower.username} followed you.`
                        });
                    })
                }

                return httpResponse(req, res, 200, 'Followed', null);
            }
            
        } catch (error) {
            return httpError(next, error, req, 500);
            
        }
    },
    unfollowUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { userId } = req.user as User;

            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: id
                    }
                }
            });

            return httpResponse(req, res, 200, 'Unfollowed', null);
        } catch (error) {
            return httpError(next, error, req, 500);
        }
    },
    acceptFollowRequest: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { userId } = req.user as User;

            const followRequest = await prisma.follow.findFirst({
                where: {
                    followerId: id,
                    followingId: userId
                }
            });

            if (!followRequest) {
                return httpError(next, new Error('Follow request not found'), req, 404);
            };

            if (followRequest.status === 'Accepted') {
                return httpResponse(req, res, 200, 'Already accepted', null);
            };

            await prisma.follow.update({
                where: {
                    followerId_followingId: {
                        followerId: id,
                        followingId: userId
                    }
                },
                data: {
                    status: 'Accepted'
                }
            });

            return httpResponse(req, res, 200, 'Follow request accepted', null);
        } catch (error) {
            return httpError(next, error, req, 500);
        }
    },
    rejectFollowRequest: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { userId } = req.user as User;
            
            const followRequest = await prisma.follow.findFirst({
                where: {
                    followerId: id,
                    followingId: userId
                }
            });

            if (!followRequest) {
                return httpError(next, new Error('Follow request not found'), req, 404);
            };

            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: id,
                        followingId: userId
                    }
                }
            });
            return httpResponse(req, res, 200, 'Follow request rejected', null);
        } catch (error) {
            // console.error("Error in rejecting follow request", error);
            return httpError(next, error, req, 500);
        }
    },
    getFollowers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;
            const { page = 1, limit = 10, search = '' } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const searchCondition = search 
                ? {
                    follower: {
                        username: {
                            contains: search as string,
                            mode: 'insensitive' as const
                        }
                    }
                }
                : {};

            const [followers, totalCount] = await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followingId: userId,
                        status: 'Accepted',
                        ...searchCondition
                    },
                    select: {
                        follower: {
                            select: {
                                username: true,
                                name: true,
                                profilePic: true,
                                userId: true
                            }
                        }
                    },
                    skip,
                    take: limitNumber,
                }),
                prisma.follow.count({
                    where: {
                        followingId: userId,
                        status: 'Accepted',
                        ...searchCondition
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            return httpResponse(req, res, 200, 'Followers fetched', {
                followers,
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
            // console.error("Error in fetching followers", error);
            return httpError(next, error, req, 500);
        }
    },
    getFollowing: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;
            const { page = 1, limit = 10, search = '' } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const searchCondition = search 
                ? {
                    following: {
                        username: {
                            contains: search as string,
                            mode: 'insensitive' as const
                        }
                    }
                }
                : {};

            const [following, totalCount] = await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followerId: userId,
                        status: 'Accepted',
                        ...searchCondition
                    },
                    select: {
                        following: {
                            select: {
                                username: true,
                                name: true,
                                profilePic: true,
                                userId: true
                            }
                        }
                    },
                    skip,
                    take: limitNumber
                }),
                prisma.follow.count({
                    where: {
                        followerId: userId,
                        status: 'Accepted',
                        ...searchCondition
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            return httpResponse(req, res, 200, 'Following fetched', {
                following,
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
            // console.error("Error in fetching following", error);
            return httpError(next, error, req, 500);
        }
    },
    getFollowRequests: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;

            const followRequests = await prisma.follow.findMany({
                where: {
                    followingId: userId,
                    status: 'Pending'
                },
                include: {
                    follower: {
                        select: {
                            username: true,
                            name: true,
                            profilePic: true,
                            userId: true
                        }
                    }
                }
            });

            return httpResponse(req, res, 200, 'Follow requests fetched', followRequests);
        } catch (error) {
            // console.error("Error in fetching follow requests", error);
            return httpError(next, error, req, 500);
        }
    },
    getOtherUserFollowers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { userId } = req.user as User;
            const { page = 1, limit = 10, search = '' } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const targetUser = await prisma.profile.findFirst({
                where: {
                    userId: id
                },
                select: {
                    type: true
                }
            });

            if (!targetUser) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (targetUser.type === 'Private') {
                const isFollowing = await prisma.follow.findFirst({
                    where: {
                        followerId: userId,
                        followingId: id,
                        status: 'Accepted'
                    }
                });

                if (!isFollowing && userId !== id) {
                    return httpError(next, new Error('This account is private'), req, 403);
                }
            }

            const searchCondition = search 
                ? {
                    follower: {
                        username: {
                            contains: search as string,
                            mode: 'insensitive' as const
                        }
                    }
                }
                : {};

            const [followers, totalCount] = await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followingId: id,
                        status: 'Accepted',
                        ...searchCondition
                    },
                    select: {
                        follower: {
                            select: {
                                username: true,
                                name: true,
                                profilePic: true,
                                userId: true
                            }
                        }
                    },
                    skip,
                    take: limitNumber
                }),
                prisma.follow.count({
                    where: {
                        followingId: id,
                        status: 'Accepted',
                        ...searchCondition
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            return httpResponse(req, res, 200, 'Followers fetched', {
                followers,
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
            return httpError(next, error, req, 500);
        }
    },
    getOtherUserFollowing: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { userId } = req.user as User;
            const { page = 1, limit = 10, search = '' } = req.query;

            const pageNumber = parseInt(page as string);
            const limitNumber = parseInt(limit as string);
            const skip = (pageNumber - 1) * limitNumber;

            const targetUser = await prisma.profile.findFirst({
                where: {
                    userId: id
                },
                select: {
                    type: true
                }
            });

            if (!targetUser) {
                return httpError(next, new Error('User not found'), req, 404);
            }

            if (targetUser.type === 'Private') {
                const isFollowing = await prisma.follow.findFirst({
                    where: {
                        followerId: userId,
                        followingId: id,
                        status: 'Accepted'
                    }
                });

                if (!isFollowing && userId !== id) {
                    return httpError(next, new Error('This account is private'), req, 403);
                }
            }

            const searchCondition = search 
                ? {
                    following: {
                        username: {
                            contains: search as string,
                            mode: 'insensitive' as const
                        }
                    }
                }
                : {};

            const [following, totalCount] = await Promise.all([
                prisma.follow.findMany({
                    where: {
                        followerId: id,
                        status: 'Accepted',
                        ...searchCondition
                    },
                    select: {
                        following: {
                            select: {
                                username: true,
                                profilePic: true,
                                userId: true
                            }
                        }
                    },
                    skip,
                    take: limitNumber
                }),
                prisma.follow.count({
                    where: {
                        followerId: id,
                        status: 'Accepted',
                        ...searchCondition
                    }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limitNumber);
            const hasNext = pageNumber < totalPages;
            const hasPrev = pageNumber > 1;

            return httpResponse(req, res, 200, 'Following fetched', {
                following,
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
            return httpError(next, error, req, 500);
        }
    }

}
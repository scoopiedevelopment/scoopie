import { NextFunction, Request, Response } from 'express';
import { User } from '../Authentication/types';
import { prisma } from '../../util/prisma';
import httpError from '../../util/httpError';
import httpResponse from '../../util/httpResponse';



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

                await prisma.follow.create({
                    data: {
                        followerId: userId,
                        followingId: id,
                        status: 'Pending'
                    }
                });
                return httpResponse(req, res, 200, 'Follow request sent', null);
            } else {
                
                await prisma.follow.create({
                    data: {
                        followerId: userId,
                        followingId: id,
                        status: 'Accepted'
                    }
                });
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

            const followers = await prisma.follow.findMany({
                where: {
                    followingId: userId,
                    status: 'Accepted'
                },
                include: {
                    follower: {
                        select: {
                            username: true,
                            profilePic: true,
                            userId: true
                        }
                    }
                }
            });

            return httpResponse(req, res, 200, 'Followers fetched', followers);
        } catch (error) {
            // console.error("Error in fetching followers", error);
            return httpError(next, error, req, 500);
        }
    },
    getFollowing: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.user as User;

            const following = await prisma.follow.findMany({
                where: {
                    followerId: userId,
                    status: 'Accepted'
                },
                include: {
                    following: {
                        select: {
                            username: true,
                            profilePic: true,
                            userId: true
                        }
                    }
                }
            });

            return httpResponse(req, res, 200, 'Following fetched', following);
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
    }

}
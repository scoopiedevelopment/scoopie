import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../util/prisma';
import httpError from '../../util/httpError';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import { User } from '../Authentication/types';
import { followQueue, redis } from '../../util/redis';
import { isValidObjectId } from 'mongoose';
import { Prisma } from '@prisma/client';
import { ToggleFollowBody, UpdateProfileBody } from './types';


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
            } = req.body as UpdateProfileBody;

            const user = req.user as User;

            const updateData: Record<string, string> = {};
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
            // console.error("Error in updating profile.", error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return httpError(next, new Error('Username is already taken. Please choose another one.'), req, 409);
                }
            }
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

            const [profileData, [postViews, postLikes, clipViews, clipLikes]] = await Promise.all([
                prisma.user.findUnique({
                  where: { id: user.userId },
                  select: {
                    email: true,
                    profile: {
                      include: {
                        _count: {
                          select: {
                            followers: true,
                            following: true,
                          },
                        },
                      },
                    },
                  },
                }),
                Promise.all([
                  prisma.post.aggregate({
                    _sum: { views: true },
                    where: { userId: user.userId },
                  }),
                  prisma.like.count({
                    where: {
                      post: {
                        userId: user.userId,
                      },
                    },
                  }),
                  prisma.clip.aggregate({
                    _sum: { views: true },
                    where: { userId: user.userId },
                  }),
                  prisma.like.count({
                    where: {
                      clip: {
                        userId: user.userId,
                      },
                    },
                  }),
                ]),
            ]);
              
            const totalViews = (postViews._sum.views ?? 0) + (clipViews._sum.views ?? 0);
            const totalLikes = (postLikes ?? 0) + (clipLikes ?? 0);

            const profileWithStats = {
            ...profileData,
            profile: {
                ...profileData?.profile,
                _count: {
                ...profileData?.profile?._count,
                totalViews,
                totalLikes,
                },
            },
            };

            httpResponse(req, res, 200, responseMessage.SUCCESS, profileWithStats);

        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getUserProfile: async (req: Request, res:Response, next:NextFunction) => {
        try {
            
            const { userId } = req.params;

            if(!userId) {
                return httpError(next, new Error('No user Id is provided.'), req, 400)
            }

            if(!isValidObjectId(userId)) {
                return httpError(next, new Error('Invalid userId.'), req, 400);
            }

            const [profileData, [postViews, postLikes, clipViews, clipLikes]] = await Promise.all([
                prisma.user.findUnique({
                  where: { id: userId },
                  select: {
                    email: true,
                    profile: {
                      include: {
                        _count: {
                          select: {
                            followers: true,
                            following: true,
                          },
                        },
                      },
                    },
                  },
                }),
                Promise.all([
                  prisma.post.aggregate({
                    _sum: { views: true },
                    where: { userId: userId },
                  }),
                  prisma.like.count({
                    where: {
                      post: {
                        userId: userId,
                      },
                    },
                  }),
                  prisma.clip.aggregate({
                    _sum: { views: true },
                    where: { userId: userId },
                  }),
                  prisma.like.count({
                    where: {
                      clip: {
                        userId: userId,
                      },
                    },
                  }),
                ]),
            ]);
              
            const totalViews = (postViews._sum.views ?? 0) + (clipViews._sum.views ?? 0);
            const totalLikes = (postLikes ?? 0) + (clipLikes ?? 0);

            if(!profileData) {
                return httpError(next, new Error('Profile not found.'), req, 404);
            }

            const profileWithStats = {
            ...profileData,
            profile: {
                ...profileData?.profile,
                _count: {
                ...profileData?.profile?._count,
                totalViews,
                totalLikes,
                },
            },
            };


            return httpResponse(req, res, 200, responseMessage.SUCCESS, profileWithStats);

        } catch (error) {
            // console.error("Error in fetching user profile.", error);
            return httpError(next, error, req, 500);
        }
    },
    checkUsername: async (req: Request, res: Response, next: NextFunction) => {
        
        try {
            const { username } = req.params;

            if (!username || typeof username !== 'string') {
                return res.status(400).json({ error: 'Username is required and must be a string.' });
            };

            const existingUser = await prisma.profile.findUnique({
                where: { username: username.toLowerCase() }, 
                select: { id: true },
            });

            if(existingUser) {
                return httpError(next, new Error('Username already taken.'), req, 409);
            };

            return httpResponse(req, res, 200, 'Username is available.', null);

        } catch (error) {
            // console.error("Error checking username:", error);
            httpError(next, error, req, 500);
        }
    },
    toggleFollow: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { 
              followingId, 
              followerId, 
              action 
            } = req.body as ToggleFollowBody;

            const isFollowing = await redis.sismember(`user:${followerId}:following`, followingId);

            if(isFollowing) {
                await redis.srem(`user:${followingId}:followers`, followerId);
                await redis.srem(`user:${followerId}:following`, followingId);

                await followQueue.add('followUpdate', {
                    followingId,
                    followerId,
                    action
                });

                return httpResponse(req, res, 200, responseMessage.UNFOLLOWED, null);
            } 
            else if(!isFollowing && action === 'Unfollow') {

                await followQueue.add('followUpdate', {
                  followingId,
                  followerId,
                  action
                });

                return httpResponse(req, res, 200, responseMessage.UNFOLLOWED, null);
            }
            else if(action === 'Follow') {
                await redis.sadd(`user:${followingId}:followers`, followerId);
                await redis.sadd(`user:${followerId}:following`, followingId);

                await followQueue.add('followUpdate', {
                    followingId,
                    followerId,
                    action
                });
                return httpResponse(req, res, 200, responseMessage.FOLLOWED, null);
            }


        } catch (error) {
            // console.error("Error while folowing user.", error);
            return httpError(next, error, req, 500);
        }
    }
    
}
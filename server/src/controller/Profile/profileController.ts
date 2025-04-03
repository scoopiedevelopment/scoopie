import { NextFunction, Request, Response } from "express";
import { prisma } from "../../util/prisma";
import httpError from "../../util/httpError";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { User } from "../Authentication/types";
import { followQueue, redis } from "../../util/redis";
import { isValidObjectId } from "mongoose";


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
                    profile: {
                        include: {
                            _count: {
                                select: {
                                    followers: true,
                                    following: true
                                }
                            }
                        }
                    },
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, profile);

        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getUserProfile: async (req: Request, res:Response, next:NextFunction) => {
        try {
            
            const { userId } = req.params;

            if(!userId) {
                return httpError(next, new Error("No user Id is provided."), req, 400)
            }

            if(!isValidObjectId(userId)) {
                return httpError(next, new Error("Invalid userId."), req, 400);
            }

            const profile = await prisma.profile.findFirst({
                where: {
                    userId
                },
                include: {
                    _count: {
                        select: {
                            followers: true,
                            following: true
                        }
                    }
                }

            });

            if(!profile) {
                return httpError(next, new Error("Profile not found."), req, 404);
            }

            return httpResponse(req, res, 200, responseMessage.SUCCESS, profile);

        } catch (error) {
            console.error("Error in fetching user profile.", error);
            return httpError(next, error, req, 500);
        }
    },
    toggleFollow: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { followingId , followerId, action } = req.body;

            const isFollowing = await redis.sismember(`user:${followerId}:following`, followingId);

            if(isFollowing) {
                await redis.srem(`user:${followingId}:followers`, followerId);
                await redis.srem(`user:${followerId}:following`, followingId);

                await followQueue.add("followUpdate", {
                    followingId,
                    followerId,
                    action
                });

                return httpResponse(req, res, 200, responseMessage.UNFOLLOWED, null);
            } 
            else if(!isFollowing && action === "Unfollow") {

                await followQueue.add("followUpdate", {
                    followingId,
                    followerId,
                    action
                });

                return httpResponse(req, res, 200, responseMessage.UNFOLLOWED, null);
            }
            else if(action === "Follow") {
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
            console.error("Error while folowing user.", error);
            return httpError(next, error, req, 500);
        }
    }
    
}
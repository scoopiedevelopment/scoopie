import { NextFunction, Request, Response } from "express";
import { redis } from "../../util/redis";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import httpError from "../../util/httpError";
import { prisma } from "../../util/prisma";
import { User } from "../Authentication/types";



export default {
    toggleLike: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { postId } = req.body;
            const user = req.user as User;
            const likeKey = `like_count:${postId}`;
            const userLikeKey = `user_liked:${postId}`;

            let hasLiked: boolean = !!(await redis.sismember(userLikeKey, user!.userId));

            if (!hasLiked) {
                
                const existingLike = await prisma.like.findFirst({
                    where: { postId, likedById: user!.userId },
                });
    
                if (existingLike) {
                    await redis.sadd(userLikeKey, user!.userId);
                    await redis.incr(likeKey);
                    hasLiked = true;
                }
            }
    
            if (hasLiked) {
                
                await redis.decr(likeKey);
                await redis.srem(userLikeKey, user!.userId);
                return httpResponse(req, res, 200, responseMessage.UNLIKED, null);
            }
    
            await redis.incr(likeKey);
            await redis.sadd(userLikeKey, user!.userId);


            return httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            console.error("Error in liking/disliking post.", error);
            httpError(next, error, req, 500)
        }
    }
}
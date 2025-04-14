import { NextFunction, Request, Response } from "express";
import { likeQueue, redis } from "../../util/redis";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import httpError from "../../util/httpError";
import { prisma } from "../../util/prisma";
import { User } from "../Authentication/types";



export default {
    toggleLike: async (req: Request, res: Response, next: NextFunction) => {

        try {
            const { postId, clipId, commentId } = req.body;

            const user = req.user as User;
            const likeKey = `like_count:${postId || clipId || commentId}`;
            const userLikeKey = `user_liked:${postId || clipId || commentId}`;

            let hasLiked: boolean = !!(await redis.sismember(userLikeKey, user!.userId));

            if (!hasLiked) {
                
                const existingLike = await prisma.like.findFirst({
                    where: {
                        ...(postId && { postId }),
                        ...(clipId && { clipId }),
                        ...(commentId && { commentId }),
                        likedById: user!.userId 
                    },
                });
    
                if (existingLike) {
                    hasLiked = true;
                }
            }
    
            if (hasLiked) {
                
                await redis.decr(likeKey);
                await redis.srem(userLikeKey, user!.userId);
                await likeQueue.add('toggleLike', {
                    postId: postId || null,
                    clipId: clipId || null,
                    commentId: commentId || null,
                    type: 'unlike',
                    likedById: user.userId,
                    createdAt: new Date().toISOString()
                });
                return httpResponse(req, res, 200, responseMessage.UNLIKED, null);
            }
    
            await redis.incr(likeKey);
            await redis.sadd(userLikeKey, user!.userId);
            await likeQueue.add('toggleLike', {
                postId: postId || null,
                clipId: clipId || null,
                commentId: commentId || null,
                type: 'like',
                likedById: user.userId,
                createdAt: new Date().toISOString()
            });


            return httpResponse(req, res, 201, responseMessage.LIKED, null);

        } catch (error) {
            console.error("Error in liking/disliking post.", error);
            httpError(next, error, req, 500)
        }
    }
}
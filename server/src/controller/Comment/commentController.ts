import { NextFunction, Request, Response } from "express"
import { User } from "../Authentication/types";
import httpError from "../../util/httpError";
import { commentQueue, redis } from "../../util/redis";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { prisma } from "../../util/prisma";


export default {
    comment: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId , comment } = req.body;
            const user = req.user as User;

            const commentData = {
                postId,
                comment,
                commentById: user.userId,
                createdAt: new Date().toISOString(),
            };

            await redis.hset(`pendingComments:${postId}`, user.userId, JSON.stringify(commentData));
            await commentQueue.add("newComment", commentData);

            return httpResponse(req, res, 201, "Commented Successfully.", null);

        } catch (error) {

            console.error("Error while creating comment.", error);
            return httpError(next, new Error(responseMessage.SOMETHING_WENT_WRONG), req, 500)
        }
    },
    getComments: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { postId, page } = req.params;
            const parshedPage = parseInt(page || "1") - 1;


            const pendingCommentsRaw = await redis.hgetall(`pendingComments:${postId}`);
            const pendingComments = Object.values(pendingCommentsRaw).map(comment => JSON.parse(comment));

            const userIds = pendingComments.map(c => c.commentById);
            let userDetailsMap: Record<string, any> = {};

            if (userIds.length > 0) {
                const users = await prisma.profile.findMany({
                    where: { userId: { in: userIds } },
                    select: { userId: true, username: true, profilePic: true }
                });

                userDetailsMap = users.reduce((acc, user) => {
                    acc[user.userId] = user;
                    return acc;
                }, {} as Record<string, any>);
            }

            const enrichedPendingComments = pendingComments.map(comment => ({
                id: null,
                comment: comment.comment,
                commentBy: userDetailsMap[comment.commentById] || { username: "Unknown", profilePic: null, userId: comment.commentById },
                createdAt: comment.createdAt
            }));


            const storedComments = await prisma.post.findFirst({
                where: {
                    id: postId
                },
                select: {
                    comments: {
                        select: {
                            id: true,
                            comment: true,
                            commentBy: {
                                select: {
                                    username: true,
                                    profilePic: true,
                                    userId: true
                                }
                            }
                        },
                        skip: parshedPage * 20,
                        take: 20,
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            });

            const allComments = [...enrichedPendingComments, ...(storedComments?.comments || [])];

            return httpResponse(req, res, 200, responseMessage.SUCCESS, allComments);

        } catch (error) {
            return httpError(next, new Error(responseMessage.SOMETHING_WENT_WRONG), req, 500)
        }
    },
    deleteComment: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { commentId } = req.params;
            const user = req.user as User;

            await prisma.comment.delete({
                where: {
                    id: commentId,
                    commentById: user.userId
                }
            });

            return httpResponse(req, res, 200, responseMessage.SUCCESS, null);
        } catch (error) {
            return httpError(next, new Error(responseMessage.SOMETHING_WENT_WRONG), req, 500)
        }
    }

}
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
            const { postId, clipId, commentId, comment } = req.body;
            const user = req.user as User;

            const commentData = {
                postId: !postId ? null : postId,
                clipId: !clipId ? null : clipId,
                // commentId: !commentId ? null : commentId,
                comment,
                commentById: user.userId,
                createdAt: new Date().toISOString(),
            };

            await redis.rpush(`pendingComments:${postId || clipId || commentId}`, JSON.stringify(commentData));
            await commentQueue.add("newComment", commentData);

            return httpResponse(req, res, 201, "Commented Successfully.", null);

        } catch (error) {

            console.error("Error while creating comment.", error);
            return httpError(next, new Error(responseMessage.SOMETHING_WENT_WRONG), req, 500)
        }
    },
    getComments: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { type, id, page } = req.params;
            const parshedPage = parseInt(page || "1") - 1;


            const pendingCommentsRaw = await redis.lrange(`pendingComments:${id}`, 0, -1);
            console.log(pendingCommentsRaw);
            
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
                createdAt: comment.createdAt,
                _count: {
                    likedBy: 0
                }
            }));

            let storedComments = null;

            if(type === "post") {

                storedComments = await prisma.post.findFirst({
                    where: {
                        id: id
                    },
                    select: {
                        comments: {
                            include: {
                                commentBy: {
                                    select: {
                                        username: true,
                                        profilePic: true,
                                        userId: true
                                    }
                                },
                                _count: {
                                    select: {
                                        likedBy: true
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

            } else if(type === "clip") {
                
                storedComments = await prisma.clip.findFirst({
                    where: {
                        id: id
                    },
                    select: {
                        comments: {
                            include: {
                                // id: true,
                                // comment: true,
                                commentBy: {
                                    select: {
                                        username: true,
                                        profilePic: true,
                                        userId: true
                                    }
                                },
                                _count: {
                                    select: {
                                        likedBy: true
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
            }

            const allComments = [...enrichedPendingComments, ...(storedComments?.comments || [])];

            return httpResponse(req, res, 200, responseMessage.SUCCESS, allComments);

        } catch (error) {
            console.error("Error in fetching comments.", error);
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
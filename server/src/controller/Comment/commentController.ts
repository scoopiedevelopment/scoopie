import { NextFunction, Request, Response } from "express"
import { User } from "../Authentication/types";
import httpError from "../../util/httpError";
import { commentQueue } from "../../util/redis";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { prisma } from "../../util/prisma";


export default {
    comment: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId , comment } = req.body;
            const user = req.user as User;

            await commentQueue.add("newComment", {
                postId,
                comment,
                commentById: user.userId,
                createdAt: new Date()
            });

            return httpResponse(req, res, 200, "Commented Successfully.", null);

        } catch (error) {

            console.error("Error while creating comment.", error);
            return httpError(next, new Error(responseMessage.SOMETHING_WENT_WRONG), req, 500)
        }
    },
    getComments: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { postId, page } = req.params;
            const parshedPage = parseInt(page || "1") - 1;
            const comments = await prisma.post.findFirst({
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
            })

            return httpResponse(req, res, 200, responseMessage.SUCCESS, comments);

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
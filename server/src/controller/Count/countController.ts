import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../util/prisma';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import httpError from '../../util/httpError';


export default {
    post: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { postId } = req.params;

            await prisma.post.update({
                where: {
                    id: postId,
                },
                data: {
                    views: {
                        increment: 1,
                    },
                },
            });

            httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            // console.error("Error in creating Count.", error);
            httpError(next, error, req, 500);
        }
    },
    clip: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { clipId } = req.params;

            await prisma.clip.update({
                where: {
                    id: clipId,
                },
                data: {
                    views: {
                        increment: 1,
                    },
                },
            });

            httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            // console.error("Error in creating Count.", error);
            httpError(next, error, req, 500);
        }
    },
    sharePost: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { postId } = req.params;

            await prisma.post.update({
                where: {
                    id: postId,
                },
                data: {
                    shares: {
                        increment: 1,
                    },
                },
            });

            httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            // console.error("Error in creating Count.", error);
            httpError(next, error, req, 500);
        }
    },
    shareClip: async (req: Request, res: Response, next: NextFunction) => {
        try {

            const { clipId } = req.params;

            await prisma.clip.update({
                where: {
                    id: clipId,
                },
                data: {
                    shares: {
                        increment: 1,
                    },
                },
            });

            httpResponse(req, res, 201, responseMessage.SUCCESS, null);

        } catch (error) {
            // console.error("Error in creating Count.", error);
            httpError(next, error, req, 500);
        }
    }
}
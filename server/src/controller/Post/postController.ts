import { NextFunction, Request, Response } from "express";
import httpError from "../../util/httpError";
import path from "path";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { checkImageForNSFW } from "../../config/sightEngine";
import { prisma } from "../../util/prisma";
import { User } from "../Authentication/types";



export default {

    createPost: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { urls, text } = req.body;
            
            const safeFiles = [];
            const user = req.user as User;
    
            if (urls || Array.isArray(urls) || urls.length !== 0 ) {
                
                for (const fileUrl of urls) {
                    const fileExt = path.extname(fileUrl).toLowerCase();
        
                    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExt)) {
                        const moderationResult = await checkImageForNSFW(fileUrl);
                        if( moderationResult?.nudity < 0.7 && moderationResult?.violence < 0.7) {
                            safeFiles.push(fileUrl);
                        }
                    } 
                    
                }

                if (safeFiles.length === 0) {
                    return httpError(next, new Error("All media files were rejected due to NSFW content."), req, 400);
                }
            }
    
            
            await prisma.post.create({
                data: {
                    userId: user.userId,
                    text,
                    media: {
                        create: safeFiles.map((media: string) => ({
                            url: media,
                            type: 'Image'
                        }))
                    }
                }
            });
    
            httpResponse(req, res, 201, responseMessage.SUCCESS, null);
    
        } catch (error) {
            console.error("Error in creating post.", error);
            httpError(next, error, req, 500);
        }
    },
    deletePost: async (req: Request, res: Response, next: NextFunction) => {
        try {;
            const { postId } = req.params;
            const user = req.user as User;

            if(!postId) {
                return httpError(next, new Error("No post Id is provided."), req, 400)
            }

            const post = await prisma.post.delete({
                where: {
                    id: postId,
                    userId: user.userId
                }
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, post);

        } catch (error) {
            console.error("Error in deleting post.", error);
            httpError(next, error, req, 500);
        }
    },
    getPostById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { postId } = req.params;
            console.log(req.params);
            
            if(!postId) {
                return httpError(next, new Error("No post Id is provided."), req, 400)
            }

            const post = await prisma.post.findUnique({
                where: {
                    id: postId
                },
                include: {
                    media: true
                }
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, post);

        } catch (error) {
            console.error("Error in fetching post.", error);
            httpError(next, error, req, 500);
        }
    },
    getUserPosts: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId } = req.params;
            
            if(!userId) {
                return httpError(next, new Error("No post Id is provided."), req, 400)
            }

            const post = await prisma.profile.findUnique({
                where: {
                    userId: userId
                },
                select: {
                    posts: true
                }
            })

            httpResponse(req, res, 201, responseMessage.SUCCESS, post);

        } catch (error) {
            console.error("Error in fetching posts.", error);
            httpError(next, error, req, 500);
        }
    },
}
import { NextFunction, Request, Response } from 'express';
import httpError from '../../util/httpError';
import httpResponse from '../../util/httpResponse';
import { User } from '../Authentication/types';
import { prisma } from '../../util/prisma';
import { ToggleSaveBody } from './types';


export default {
    toggleSave: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { postId, clipId } = req.body as ToggleSaveBody;
    const { userId } = req.user as User;

    if (!userId || (!postId && !clipId)) {
      return httpError(next, new Error('User ID and Post or Clip ID required'), req, 400);
    }

    let existing;

    if (postId) {
      existing = await prisma.saved.findFirst({ where: { userId, postId } });

      if (existing) {
        await prisma.saved.delete({ where: { id: existing.id } });
        return httpResponse(req, res, 200, 'Removed from saved', null);
      }

      await prisma.saved.create({
        data: { userId, postId, clipId: null },
      });
    }

    if (clipId) {
      existing = await prisma.saved.findFirst({ where: { userId, clipId } });

      if (existing) {
        await prisma.saved.delete({ where: { id: existing.id } });
        return httpResponse(req, res, 200, 'Removed from saved', null);
      }

      await prisma.saved.create({
        data: { userId, clipId, postId: null },
      });
    }

    return httpResponse(req, res, 200, 'Saved successfully', null);

  } catch (error) {
    console.error("Error while saving/removing post/clip.", error);
    return httpError(next, error, req, 500);
  }
},

    getSaved: async (req: Request, res: Response, next: NextFunction) => {
        try {
          const { userId } = req.user as User;
      
          if (!userId) {
            return httpResponse(req, res, 400, 'User ID is required');
          }
      
          const page = parseInt(req.params.page) || 1;
          const limit = 20;
          const skip = (page - 1) * limit;
      
          const savedItems = await prisma.saved.findMany({
            where: { userId },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
            select: {
              createdAt: true,
              post: {
                include: {
                  media: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      profilePic: true,
                    },
                  },
                },
              },
              clip: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      profilePic: true,
                    },
                  },
                },
              },
            },
          });
      
          return httpResponse(req, res, 200, 'Fetched saved items', savedItems);
        } catch (error) {
          // console.error("Error while fetching saved items.", error);
          return httpError(next, error, req, 500);
        }
      }
      
      
}
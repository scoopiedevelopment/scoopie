import { NextFunction, Request, Response } from 'express';
import { User } from '../Authentication/types';
import httpError from '../../util/httpError';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';
import { prisma } from '../../util/prisma';
import { CommentBody } from './types';

export default {
  // 🔹 Add a new comment
  comment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId, clipId, commentId, comment } = req.body as CommentBody;
      const user = req.user as User;

      if (!comment || (!postId && !clipId && !commentId)) {
        return httpResponse(req, res, 400, "Invalid request", null);
      }

      await prisma.comment.create({
        data: {
          postId: postId || null,
          clipId: clipId || null,
          parentCommentId: commentId || null,
          comment,
          commentById: user.userId,
        },
      });

      return httpResponse(req, res, 201, 'Commented Successfully.', null);

    } catch (error) {
      return httpError(next, error, req, 500);
    }
  },

  // 🔹 Get comments (with pagination)
  getComments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, id, page } = req.params;
      const parsedPage = parseInt(page || '1', 10) - 1;

      let storedComments = null;
      let storedCommentsofComment = null;

      if (type === 'post') {
        storedComments = await prisma.post.findFirst({
          where: { id },
          select: {
            comments: {
              include: {
                commentBy: {
                  select: {
                    username: true,
                    profilePic: true,
                    userId: true,
                  },
                },
                _count: { select: { likedBy: true } },
              },
              skip: parsedPage * 20,
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      } else if (type === 'clip') {
        storedComments = await prisma.clip.findFirst({
          where: { id },
          select: {
            comments: {
              include: {
                commentBy: {
                  select: {
                    username: true,
                    profilePic: true,
                    userId: true,
                  },
                },
                _count: { select: { likedBy: true } },
              },
              skip: parsedPage * 20,
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      } else if (type === 'comment') {
        storedCommentsofComment = await prisma.comment.findFirst({
          where: { id },
          select: {
            replies: {
              include: {
                commentBy: {
                  select: {
                    username: true,
                    profilePic: true,
                    userId: true,
                  },
                },
                _count: { select: { likedBy: true } },
              },
              skip: parsedPage * 20,
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      }

      const allComments = storedComments?.comments ?? storedCommentsofComment?.replies ?? [];

      return httpResponse(req, res, 200, responseMessage.SUCCESS, allComments);
    } catch (error) {
      return httpError(next, error, req, 500);
    }
  },

  // 🔹 Delete comment
  deleteComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { commentId } = req.params;
      const user = req.user as User;

      await prisma.comment.deleteMany({
        where: {
          id: commentId,
          commentById: user.userId, // only author can delete
        },
      });

      return httpResponse(req, res, 200, responseMessage.SUCCESS, null);
    } catch (error) {
      return httpError(next, error, req, 500);
    }
  },
};

import { NextFunction, Request, Response } from "express";
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

    if (!postId && !clipId && !commentId) {
      return httpResponse(req, res, 400, "No target provided", null);
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        ...(postId && { postId }),
        ...(clipId && { clipId }),
        ...(commentId && { commentId }),
        likedById: user.userId,
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      return httpResponse(req, res, 200, responseMessage.UNLIKED, null);
    }

    await prisma.like.create({
      data: {
        postId: postId || null,
        clipId: clipId || null,
        commentId: commentId || null,
        likedById: user.userId,
      },
    });

    return httpResponse(req, res, 200, responseMessage.LIKED, null);

  } catch (error) {
    console.error("Error in liking/disliking post.", error);
    httpError(next, error, req, 500);
  }
}

}
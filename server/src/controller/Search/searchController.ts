import { Request, Response, NextFunction } from "express";
import httpResponse from "../../util/httpResponse";
import responseMessage from "../../constant/responseMessage";
import { prisma } from "../../util/prisma";
import httpError from "../../util/httpError";

export default {
  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.params.q?.toString().toLowerCase() || "";
      const tab = req.params.tab?.toString() || "top";

      if (!query) {
        return httpError(next, new Error("Query is required."), req, 400);
      }

      let LIMIT = 30;
      
      if(tab === "top") LIMIT = 10;

      const getAccounts = () =>
        prisma.profile.findMany({
          where: {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
          take: LIMIT,
          select: {
            id: true,
            userId: true,
            username: true,
            name: true,
            profilePic: true,
            _count: {
                select: {
                    followers: true
                }
            }
          },
        });

      const getClips = () =>
        prisma.clip.findMany({
          where: {
            text: {
              contains: query,
              mode: "insensitive",
            },
          },
          take: LIMIT,
          select: {
            id: true,
            video: true,
            text: true,
          },
        });

      const getPosts = () =>
        prisma.post.findMany({
          where: {
            text: {
              contains: query,
              mode: "insensitive",
            },
          },
          take: LIMIT,
          select: {
            id: true,
            media: true,
            text: true,
          },
        });

      if (tab === "accounts") {
        const accounts = await getAccounts();
        return httpResponse(req, res, 200, responseMessage.SUCCESS, accounts);
      }

      if (tab === "clips") {
        const clips = await getClips();
        return httpResponse(req, res, 200, responseMessage.SUCCESS, clips);
      }

      if (tab === "posts") {
        const posts = await getPosts();
        return httpResponse(req, res, 200, responseMessage.SUCCESS, posts);
      }

      const [accounts, clips, posts] = await Promise.all([
        getAccounts(),
        getClips(),
        getPosts(),
      ]);

      const top = [
            {
                type: "Accounts",
                accounts
            },
            {
                type: "clips",
                clips
            },
            {
                type: "posts",
                posts
            },
        ]

      return httpResponse(req, res, 200, responseMessage.SUCCESS, top);

    } catch (error) {
      console.error("Error while querying.", error);
      return httpError(next, error, req, 500);
    }
  },
};

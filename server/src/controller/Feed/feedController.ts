import { NextFunction, Request, Response } from 'express';
import httpError from '../../util/httpError';
import { prisma } from '../../util/prisma';
import { User } from '../Authentication/types';
import httpResponse from '../../util/httpResponse';
import responseMessage from '../../constant/responseMessage';

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getMixedFeed({
  id,
  limit,
  page,
}: {
  id: string;
  limit: number;
  page: number;
}) {

  const userFollowing = await prisma.profile.findUnique({
    where: { userId: id },
    select: {
      following: {
        where: { status: "Accepted" },
        select: { followingId: true },
      },
    },
  });

  const followingIds =
    userFollowing?.following.map((f: { followingId: string }) => f.followingId) || [];

  const followingPosts = await prisma.post.findMany({
    where: {
      userId: { in: followingIds },
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, 
    },
    include: {
      media: { select: { url: true, type: true } },
      user: { select: { id: true, username: true, profilePic: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { likedById: id }, select: { likedById: true } },
      savedBy: { where: { userId: id }, select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: page * limit,
    take: limit,
  });

  if (followingPosts.length >= limit) {
    return followingPosts;
  }

  const excludeIds = new Set(followingPosts.map((p) => p.id));
  const remaining = limit - followingPosts.length;

  const trendingPosts = await prisma.post.findMany({
    where: {
      id: { notIn: Array.from(excludeIds) },
      user: { type: "Public" },
    },
    include: {
      media: { select: { url: true, type: true } },
      user: { select: { userId: true, username: true, profilePic: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { likedById: id }, select: { likedById: true } },
      savedBy: { where: { userId: id }, select: { userId: true } },
    },
    orderBy: [
      { likes: { _count: "desc" } },
      { comments: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    skip: page * limit, 
    take: remaining,
  });

  const feed = shuffleArray([...followingPosts, ...trendingPosts]);

  return feed;
}



export default {
    feeds: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as User;
            const { page } = req.params;

            const parsedPage = parseInt(page || "1") - 1; // 0-based
            const limit = 20;

            const feed = await getMixedFeed({
            id: user.userId,
            limit,
            page: parsedPage,
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, feed);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    },
    clipFeeds: async (req: Request, res: Response, next: NextFunction) => {

        try {

            const { page } = req.params;
            const limit = 20;
            const skip = parseInt( page || '1') - 1;
            const user = req.user as User;

            const tredingClips = await prisma.clip.findMany({
                where: {
                    user: {
                        type: 'Public'
                    }
                },
                include: {
                    user: {
                        select: {
                            userId: true,
                            username: true,
                            profilePic: true,
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    },
                    likes: {
                        where: {
                            likedById: user.userId
                        },
                        select: {
                            likedById: true
                        }
                    },
                    savedBy: {
                        where: {
                            userId: user.userId
                        },
                        select: {
                            userId: true
                        }
                    }
                },
                take: limit,
                skip: skip * limit,
                orderBy: [
                    { likes: { _count: 'desc'}},
                    { comments: { _count: 'desc'}},
                    { createdAt: 'desc'}
                ]
            });

            httpResponse(req, res, 200, responseMessage.SUCCESS, tredingClips);

        } catch (error) {
            // console.error("Error in fetching clips feed.", error);
            httpError(next, error, req, 500);
        }
    },
    addedFeeds: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page } = req.params;
            const limit = 20;
            const skip = parseInt( page || '1') - 1;
            const user = req.user as User; 

            const userFollowing = await prisma.profile.findUnique({
                where: {
                    userId: user.userId
                },
                select: {
                    following: {
                        where: {
                            status: 'Accepted'
                        },
                        select: {
                            followingId: true
                        }
                    }
                }
            });
            
        
            const followingIds = userFollowing?.following.map( (following: {followingId: string}) => following.followingId) || [];
            
        
            const followingPosts = await prisma.post.findMany({
                where: {
                    userId: {
                        in: followingIds
                    },
                },
                include: {
                    media: {
                      select: {
                        url: true,
                        type: true
                      }  
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                            profilePic: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    },
                    likes: {
                        where: {
                            likedById: user.userId
                        },
                        select: {
                            likedById: true
                        }
                    },
                    savedBy: {
                        where: {
                            userId: user.userId
                        },
                        select: {
                            userId: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc'},
                skip: skip * limit,
                take: 10
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS, followingPosts);

        } catch (error) {
            // console.error("Error in fetching added feeds.", error);
            httpError(next, error, req, 500);
        }
    }
}
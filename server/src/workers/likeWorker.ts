import { Worker } from 'bullmq';
import { prisma } from '../util/prisma';
import { redis } from '../util/redis';

const BATCH_SIZE = 50;
const BATCH_TIME_MS =2 * 60 * 1000;

let likeBatch: any[] = [];
let batchTimer: NodeJS.Timeout | null = null;

new Worker(
  "likeQueue",
  async (job) => {
    const like = job.data;
    likeBatch.push(like);

    console.log(`Added like to batch, total: ${likeBatch.length}`);

    if (likeBatch.length >= BATCH_SIZE) {
      await processBatch();
    } else if (!batchTimer) {
      batchTimer = setTimeout(processBatch, BATCH_TIME_MS);
    }
  },
  {
    connection: redis,
  }
);

async function processBatch() {
  if (likeBatch.length === 0) return;

  console.log(`Processing batch of ${likeBatch.length} likes...`);

  const latestActionsMap = new Map<string, any>();

  for (const action of likeBatch) {
    const key = `${action.likedById}:${action.postId || action.clipId || action.commentId}`;
    latestActionsMap.set(key, action); 
  }

  const finalLikes: any[] = [];
  const finalUnlikes: any[] = [];

  for (const action of latestActionsMap.values()) {
    const baseData: any = {
      likedById: action.likedById,
    };
    if (action.postId) baseData.postId = action.postId;
    if (action.clipId) baseData.clipId = action.clipId;
    if (action.commentId) baseData.commentId = action.commentId;

    if (action.type === 'like') {
      finalLikes.push(baseData);
    } else if (action.type === 'unlike') {
      finalUnlikes.push(baseData);
    }
  }

  try {
    if (finalLikes.length > 0) {
      await prisma.like.createMany({ data: finalLikes });

      for (const like of finalLikes) {
        const userLikeKey = `user_liked:${like.postId || like.clipId || like.commentId}`;
        await redis.srem(userLikeKey, like.likedById);
      }
    }

    if (finalUnlikes.length > 0) {
      await prisma.like.deleteMany({
        where: {
          OR: finalUnlikes.map((item) => ({
            likedById: item.likedById,
            ...(item.postId && { postId: item.postId }),
            ...(item.clipId && { clipId: item.clipId }),
            ...(item.commentId && { commentId: item.commentId }),
          })),
        },
      });
    }

    console.log("Batch processed successfully!");
  } catch (error) {
    console.error("Error processing batch:", error);
  }

  likeBatch = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

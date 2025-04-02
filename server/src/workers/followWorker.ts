import { Worker } from 'bullmq';
import { prisma } from '../util/prisma';
import { redis } from '../util/redis';

const BATCH_SIZE = 50;
const BATCH_TIME_MS = 2 * 60 * 1000;

let followBatch: any[] = [];
let batchTimer: NodeJS.Timeout | null = null;

new Worker(
  "followQueue",
  async (job) => {
    const comment = job.data;
    followBatch.push(comment);
    
    console.log(`Added follows to batch, total: ${followBatch.length}`);
    
    if (followBatch.length >= BATCH_SIZE) {
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
  
  if (followBatch.length === 0) return;
  
  console.log(`Processing batch of ${followBatch.length} following...`);
  
  try {
    const actionMap = new Map();
    for (const { followerId, followingId, action } of followBatch) {
      const key = `${followerId}-${followingId}`;
      if (action === "Unfollow") {
        actionMap.set(key, "Unfollow");
      } else if (!actionMap.has(key)) {
        actionMap.set(key, "Follow");
      }
    }
    
    const follows = [];
    const unfollows = [];

    for (const [key, action] of actionMap.entries()) {
      const [followerId, followingId] = key.split("-");
      if (action === "Follow") {
        follows.push({ followerId, followingId });
      } else {
        unfollows.push({ followerId, followingId });
      }
    }
    
    if(follows.length > 0) {
      await prisma.follow.createMany({
        data: follows.map(({ followerId, followingId }) => ({
            followerId,
            followingId
        }))
      });
    };

    if(unfollows.length > 0) {
      await prisma.follow.deleteMany({
        where: {
          OR: unfollows.map(({ followerId, followingId }) => ({
              followerId,
              followingId
          })),
        },
      })
    }

    for (const { followerId, followingId } of follows) {
      await redis.sadd(`user:${followingId}:followers`, followerId);
      await redis.sadd(`user:${followerId}:following`, followingId);
    }

    for (const { followerId, followingId } of unfollows) {
      await redis.srem(`user:${followingId}:followers`, followerId);
      await redis.srem(`user:${followerId}:following`, followingId);
    }

  } catch (error) {
    console.error("Error inserting batch:", error);
  }

  followBatch = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

console.log("Follow Worker started, waiting for jobs...");

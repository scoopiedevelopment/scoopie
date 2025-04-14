import { Worker } from 'bullmq';
import { prisma } from '../util/prisma';
import { redis } from '../util/redis';

const BATCH_SIZE = 50;
const BATCH_TIME_MS = 2 * 60 * 1000;

let commentBatch: any[] = [];
let batchTimer: NodeJS.Timeout | null = null;

new Worker(
  "commentQueue",
  async (job) => {
    const comment = job.data;
    commentBatch.push(comment);

    console.log(`Added comment to batch, total: ${commentBatch.length}`);

    if (commentBatch.length >= BATCH_SIZE) {
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

  if (commentBatch.length === 0) return;

  console.log(`Processing batch of ${commentBatch.length} comments...`);

  try {
    await prisma.comment.createMany({ data: commentBatch });
    commentBatch.forEach(async (comment) => {
      await redis.del(`pendingComments:${comment.postId || comment.clipId || comment.commentId}`);
    })
    console.log("Batch inserted successfully!");
  } catch (error) {
    console.error("Error inserting batch:", error);
  }

  commentBatch = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

console.log("Comment Worker started, waiting for jobs...");

import { Worker } from 'bullmq';
import { prisma } from '../util/prisma';
import { redis } from '../util/redis';
import { NotificationType } from '@prisma/client';
import { sendNotification } from '../util/notification';

const BATCH_SIZE = 50;
const BATCH_TIME_MS = 2 * 60 * 1000;

let commentBatch: any[] = [];
let batchTimer: NodeJS.Timeout | null = null;

new Worker(
  "commentQueue",
  async (job) => {
    const comment = job.data;
    console.log(comment);
    
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
    const commentData = commentBatch.map(({commentTo, ...rest}) => rest);
    await prisma.comment.createMany({ data: commentData });
    commentBatch.forEach(async (comment) => {
      await redis.del(`pendingComments:${comment.postId || comment.clipId || comment.parentCommentId}`);
    })

    const users = await prisma.profile.findMany({
      where: {
        userId: {
          in: commentBatch.map((val) => val.commentById)
        }
      },
      select: {
        username: true,
        userId: true,
        fcmTokens: true
      }
    });

    const notificationData = commentBatch.map(comment => ({
      userId: comment.commentTo,
      type: NotificationType.comment,
      senderId: comment.commentById,
      message: `${users.find(user => user.userId === comment.commentById)?.username} commented: ${comment.comment}`, 
    }));

    await prisma.notification.createMany({ data: notificationData });

    notificationData.map((notification) => {
      users.find(user => user.userId === notification.userId)?.fcmTokens.map(token => {
        sendNotification({
          fcmToken: token.token,
          title: 'New Comment',
          body: notification.message
        });
      })
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

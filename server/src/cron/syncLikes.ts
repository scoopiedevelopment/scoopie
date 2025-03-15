import cron from "node-cron";
import { redis } from "../util/redis";
import { prisma } from "../util/prisma";

async function syncLikesToDB() {
    console.log("⏳ Syncing likes from Redis to DB...");
    
    const keys = await redis.keys("user_liked:*");

    for (const key of keys) {
        const postId = key.split(":")[1];
        const userIds = await redis.smembers(key);

        const existingLikes = await prisma.like.findMany({
            where: {
              postId,
              likedById: { in: userIds }
            },
            select: { likedById: true }
        });
            
        const existingUserIds = new Set(existingLikes.map(like => like.likedById));

        const likesToDelete = userIds.filter(userId => existingUserIds.has(userId));
        const likesToCreate = userIds.filter(userId => !existingUserIds.has(userId));

        if(likesToCreate.length > 0) {
            await prisma.like.createMany({
                data: likesToCreate.map((id) => ({
                    postId,
                    likedById: id
                })),
                skipDuplicates: true as never
            })

        }

        if(likesToDelete.length > 0) {
            await prisma.like.deleteMany({
                where: {
                    postId,
                    likedById: {in: likesToDelete}
                }
            })
            
        }

        redis.srem(key);

    }

    console.log("✅ Likes & unlikes synced successfully.");
}

cron.schedule("*/5 * * * *", syncLikesToDB);

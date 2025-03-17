import cron from "node-cron";
import { redis } from "../util/redis";
import { prisma } from "../util/prisma";

async function syncLikesToDB() {
    console.log("⏳ Syncing likes from Redis to DB...");
    try {
        const keys = await redis.keys("user_liked:*");
        for (const key of keys) {
            const postId = key.split(":")[1];
            const userIds = await redis.smembers(key);
            redis.del(key);
    
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
        }
    
        console.log("✅ Likes & unlikes synced successfully.");
        
    } catch (error) {
        console.error("Error in syning likes.", error);
        
    }
}

cron.schedule("*/5 * * * *", syncLikesToDB);

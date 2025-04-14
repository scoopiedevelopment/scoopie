import Redis from "ioredis";
import { Queue } from 'bullmq';
import config from "../config/config";

export const redis = new Redis(config.REDIS_URL!, {
    maxRetriesPerRequest: null
});

export const likeQueue = new Queue("likeQueue", { connection: redis });
export const commentQueue = new Queue("commentQueue", { connection: redis });
export const followQueue = new Queue("followQueue", { connection: redis });

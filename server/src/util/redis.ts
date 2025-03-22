import Redis from "ioredis";
import { Queue } from 'bullmq';
import config from "../config/config";

export const redis = new Redis(config.REDIS_URL!, {
    maxRetriesPerRequest: null
});
export const commentQueue = new Queue("commentQueue", { connection: redis });
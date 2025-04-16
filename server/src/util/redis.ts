import Redis from 'ioredis';
import { Queue } from 'bullmq';
import config from '../config/config';

export const redis = new Redis({
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT),
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null
  });

export const likeQueue = new Queue('likeQueue', { connection: redis });
export const commentQueue = new Queue('commentQueue', { connection: redis });
export const followQueue = new Queue('followQueue', { connection: redis });

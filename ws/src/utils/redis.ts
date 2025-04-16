import Redis from "ioredis";
import { Queue } from 'bullmq';
import config from "../config/config";

export const redis = new Redis({
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT),
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null
  });

export const undeliveredMesssage = new Queue("undeliveredMesssage", { connection: redis });



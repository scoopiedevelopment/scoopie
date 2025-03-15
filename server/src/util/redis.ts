import Redis from "ioredis"
import config from "../config/config";

export const redis = new Redis(config.REDIS_URL!);
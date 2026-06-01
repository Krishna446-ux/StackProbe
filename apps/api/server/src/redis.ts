import Redis from 'ioredis'
// this is not getting used, just wrote for checking purposes if redis working or not
import 'dotenv/config'
export const connection = {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost"
}

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

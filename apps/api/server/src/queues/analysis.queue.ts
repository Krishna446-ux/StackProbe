// this is the api side or producer queue
import { Queue } from 'bullmq'
import "dotenv/config"
//needs a queue name and redis connection
//redis connection
const connection = {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost"
}
//analysis is the queue name, we export it
export const analysisQueue = new Queue('analysis', { connection })
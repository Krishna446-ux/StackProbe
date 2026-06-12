// this is the api side or producer queue
import { Queue } from 'bullmq'
import { redis } from '../redis'
import "dotenv/config"
//needs a queue name and redis connection
//redis connection
//using ioredis connection directly or using redis client
//analysis is the queue name, we export it
const analysisQueue = new Queue('analysis', { connection: redis, })
export default analysisQueue;



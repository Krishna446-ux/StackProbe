// this is the api side or producer queue
import { Queue } from 'bullmq'
import { connection } from '../redis'
import "dotenv/config"
//needs a queue name and redis connection
//redis connection
//analysis is the queue name, we export it
const analysisQueue = new Queue('analysis', { connection })
export default analysisQueue;



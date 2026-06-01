import { Worker } from 'bullmq'
import { processorFunction, onFaliure, onCompletion } from './processors/analysis_processor.js'
import logger from './lib/logger.js';
import "dotenv/config"
const connection = {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost"
}
//basically this is worker end, so it is sitting for any jobs, whenever it comes it will take that job 
//and give it to processorFunciton(job)
export const worker = new Worker('analysis', processorFunction, {
    connection
})
//events on workers
worker.on("completed", onCompletion)
worker.on("failed", onFaliure)
//needs controller connection to redis and queue name
//queue name is analysis 

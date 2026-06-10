import { Worker } from 'bullmq'
import { repoAnalysisProcessor } from './jobs/repoAnalysisProcessor.js'
import { onCompletion, onFaliure } from './events/worker.events.js'
import redis from "./lib/redis.js"
import logger from './lib/logger.js';
import "dotenv/config"
const connection = {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost"
}

//basically this is worker end, so it is sitting for any jobs, whenever it comes it will take that job 
//and give it to processorFunciton(job)

export const worker = new Worker('analysis', repoAnalysisProcessor, { connection })
// This is the job object inserted inside the queue
//"job_id": jobRecord.job_id,
//"repo_id": details.repo_id,
//"repo_url": repoUrl


//Creating heartbeat over here, reason being, if the worker crashes, then this program basically dies of
//So now in case this file(the worker) crashes, the heartbeast stores in redis will expire
//And when then frontend will check for the heartbeat(through the endpount), it will know that the worker is dead

//IIFE Immediately Invoked Function Expression
// (async () => {

// })();
async function heartbeat() {
    // it stores worker:heartbeat as the key and Date.now as the value, EX means expiry and 60 means seconds,
    // so it will expire in 60 seconds
    try {
        //sending heartbeast the instant the worker starts running
        await redis.set('worker:heartbeat', Date.now(), "EX", 60);
        setInterval(async () => {
            try {
                await redis.set('worker:heartbeat', Date.now(), "EX", 60);
            }
            catch (err: any) {
                logger.error(err);
            }
        }, 30000)
    }
    catch (err: any) {
        logger.error({ err }, "Failed To send the Worker heartbeat");
    }
}
heartbeat();



//events on workers
worker.on("completed", onCompletion)
worker.on("failed", onFaliure)
//needs controller connection to redis and queue name
//queue name is analysis 

// const queueEvents = new QueueEvents('paint-pictures', {
//     connection: { host: 'localhost', port: 6379 }
// });
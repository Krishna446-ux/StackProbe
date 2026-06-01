//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import logger from '../lib/logger.js'
import { setJobStatus } from '../services/worker_db.js'

async function sleep(n: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, n));
}
//use logger instead of console.log for logging stuff 
//processorFunction

/* This is job, inside the queue
    {
        "job_id": jobRecord.job_id,
        "repo_id": details.repo_id,
        "repo_url": repoUrl
    }
*/
export const processorFunction = async (job: any) => {
    //make a services folder and create a function to update the repo based on the id given,
    //update the status of the job to running
    try {
        // here we are trying to do the job in case anything throws error,
        // we say its a faliure
        console.log("Running")
        throw new Error("test failure");
        await setJobStatus(job.data.job_id, "RUNNING", "");
        await sleep(30000);
        console.log("completed")
        //update the status of the job to complete
        await setJobStatus(job.data.job_id, "COMPLETE", "");
    }
    catch (err: any) {
        logger.error(err);
        //need some faliure reasons
        //temp faliur reasons
        throw new Error("test failure");

    }
}
export const onFaliure = async (job: any, err: Error) => {
    logger.info(
        {
            jobId: job.id,
            jobName: job.name,
            data: job.data,
        }, "Job Failed")
    logger.error(err)
    await setJobStatus(job.data.job_id, "FAILED", "Something went wrong");
};
export const onCompletion = (job: any) => {
    logger.info(
        {
            jobId: job.id,
            jobName: job.name,
            data: job.data,
        },
        "Job completed"
    );
}
// * update DB
// * fake processing
// * create report
// * mark COMPLETE


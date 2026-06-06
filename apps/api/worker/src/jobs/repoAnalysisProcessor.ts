//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import { ReportInstance, Report } from '../interfaces/report_interface.js';
import logger from '../lib/logger.js'
import { setJobStatus } from '../repositories/jobRepository'
import { cloneRepo } from '../services/cloneRepo.js'
import fileSearcher from '../services/filesTracker.js'
import esLint from '../services/eslint.js'
import { calculateQualityScore } from '../services/calculateScore'
import findings from '../services/finding.js'
import { insertReport } from '../repositories/reportRepository'
import fs from 'fs/promises'
import path from 'path';
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
//this timeout function returns a promise that will reject on timeout along with the cancel function for the same thing
//
const timeout = (ms: number) => {
    let timer: NodeJS.Timeout;
    const promise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Job TimeLimit Exceeded")), ms);
    });
    return {
        cancel: () => clearTimeout(timer),
        promise
    }
}
const runAnalysis = async (job: any) => {

    // here we are trying to do the job in case anything throws error,
    // we say its a faliure
    //not putting a try catch block since we already keep this function inside a try catch block 

    console.log("Running")
    // give back cloned repo path
    const repoPath: string = await cloneRepo(job.data.repo_url, job.data.job_id);
    // gives back list of files, but more importantly throws an error in case the repo does not has any js/ts/tsx/jsx files
    const files: string[] = await fileSearcher(job.data.job_id);
    //if (files.length === 0) //
    const eslint = await esLint(repoPath);
    logger.info("Calculating score")
    const quality_score = calculateQualityScore(eslint);
    logger.info("Generating Report")
    const generatedReport: ReportInstance = {
        "job_id": job.data.job_id,
        "quality_score": quality_score,
        "security_score": 78,
        "ai_summary": "haha, we will use ai later nerd",
    }

    const report_id = await insertReport(generatedReport);


    //create findings report, category is eslint and insert inside database
    await findings(report_id, eslint);



    //update the status of the job to complete

    // the update db function are inside the bull mq events, so in case of completion and faliure,
    // those fucntion are respoinsible for database updates

    //return statements marks the job as complete
    //throw new Error("Test Faliure");
    logger.info("Job has been succesfully completed")
}
export const repoAnalysisProcessor = async (job: any) => {
    //make a services folder and create a function to update the repo based on the id given,
    //update the status of the job to running
    logger.info("Worker has started to work on job :", job.data.job_id)
    const timer = timeout(100 * 60000);
    try {
        await setJobStatus(job.data.job_id, "RUNNING", "");
        logger.info("RACE STARTED");
        //basically promise.race, means wait for the first promise to resolve, then continue the process
        //still we need to clear out the timeout
        await Promise.race([runAnalysis(job), timer.promise]);
        return { success: true };
    }
    catch (err: any) {

        logger.error({ jobId: job.data.job_id, error: err.message }, "Processor pipeline execution crashed");
        // Re-throw the actual error message so BullMQ listener can read it
        throw new Error(err.message || "Job could not be completed");
    }
    finally {
        //this needed to be here, since no matter job gets compelted or not, timer has to cancelled in both cases,
        //otherwise it will keep running, and if the function is finsihed, it will escape into global Nodejs
        //runtime
        timer.cancel();
        const directoryPath = path.join(process.cwd(), "tmp", "stackprobe", job.data.job_id);
        try {
            await fs.rm(directoryPath, {
                recursive: true,
                force: true
            });
            console.log(`Successfully deleted folder: ${directoryPath}`);
        } catch (err) {
            logger.error({ err, directoryPath }, "Failed to delete temporary repository");
        }
    }
}




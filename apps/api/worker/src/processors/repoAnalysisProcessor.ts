//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import { ReportInstance, Report } from '../interfaces/report_interface.js';
import logger from '../lib/logger.js'
import { setJobStatus, setReportDetails } from '../services/worker_db.js'

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
export const repoAnalysisProcessor = async (job: any) => {
    //make a services folder and create a function to update the repo based on the id given,
    //update the status of the job to running
    try {
        // here we are trying to do the job in case anything throws error,
        // we say its a faliure
        console.log("Running")
        //throw new Error("test failure");
        await setJobStatus(job.data.job_id, "RUNNING", "");
        await sleep(10000);
        //fake report
        const generatedReport: ReportInstance = {
            "job_id": job.data.job_id,
            "quality_score": 45,
            "security_score": 78,
            "ai_summary": "haha, we will use ai later nerd",
        }
        const report: Report = await setReportDetails(generatedReport);

        //update the status of the job to complete

        // the update db function are inside the bull mq events, so in case of completion and faliure,
        // those fucntion are respoinsible for database updates

        //return statements marks the job as complete
        return { success: true };
    }
    catch (err: any) {
        logger.error({ jobId: job.data.job_id, error: err.message }, "Processor pipeline execution crashed");

        // Re-throw the actual error message so BullMQ listener can read it
        throw new Error(err.message || "Job could not be completed");
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
    const errorMessage = err.message || "Something went wrong during execution";
    await setJobStatus(job.data.job_id, "FAILED", errorMessage);
};
export const onCompletion = async (job: any) => {
    await setJobStatus(job.data.job_id, "COMPLETE", "");
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


import pino from '../lib/db'
import logger from '../lib/logger'
import { setJobStatus, setReportDetails } from '../repositories/jobRepository'

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
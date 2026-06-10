import logger from '../lib/logger.js'
import { setJobStatus } from '../repositories/jobRepository.js'

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
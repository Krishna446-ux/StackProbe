import { createRepo } from '../services/repo.services'
import { createJob } from '../services/repo.services'
import { activeJob, completedJob, getAnalyzedRepositories, getRepositoryHistory } from '../services/repo.services'
import { RepoInterface } from '../interfaces/repoInterface'
import { JobInterface } from '../interfaces/jobInterface'
import { Request, Response } from 'express'
import analysisQueue from '../queues/analysis.queue'
import logger from '../services/logger'
interface jobObject {
    "repo_id": string;
    "status": string;
}

//HANDLING RACE CONDTIONS
//Exactly how does the code prepare in case two requests simulatanleously asking for the same repo to
// to be inserted are posted? Answer-> We do it using databases, all the requests are sent to databses, it 
// is there job to make sure duplicates do not happen
// Here, we added 
export const makeRepoRecord = async (req: Request, res: Response) => {

    const { repoUrl, force = false } = req.body;
    //force means regardless create a job, so just do not check if there is any active job or not.
    if (!repoUrl) {
        return res.status(400).send("Repo url not found");
        //401 for auth error
        //400 client sent invalid data
    }
    //await makeRepoRecord((req as any).repoUrl);

    const match = repoUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/);

    if (!match) {
        return res.status(400).send("Wrong Repo Url")
        //401 for auth error
        ////400 client sent invalid data
    }
    const owner = match[1];
    const name = match[2];
    try {

        const details: RepoInterface = await createRepo(owner, name);

        // force ==true means create a new job for this repo right now
        //otherwise look for if someone else asked for the same repo or if this repo has been previously processed
        if (force === false) {

            //export  interface JobInterface{
            //     "job_id":'string';
            //     "repo_id":'string';
            //     "user_id":'string';
            //     "status":'string';
            //     "started_at":'date';
            //     "completed_at":'date';
            //     "faliure_reason":'string';
            // };
            // this part causes race condtions since, both the request come, check for active jobs finds out there are none, and create there two serpate jobs, to fix this ,we have to make sure that a job there can only be single repo:id exists when status is running and pending
            // WARNING:
            // Race condition possible here.
            // Two concurrent force=false requests can both pass the activeJob()
            // check and create separate jobs.
            //
            // Future fix: DB-backed idempotency / transactional locking.
            const activeJobResult = await activeJob(details.repo_id)
            if ((activeJobResult as any).success === true) {
                return res.status(200).json({
                    "job_id": (activeJobResult as any).job.job_id,
                    "status": (activeJobResult as any).job.status,
                    "repo_id": (activeJobResult as any).job.repo_id,
                    "user_id": (activeJobResult as any).job.user_id,
                    "started_at": (activeJobResult as any).job.started_at,
                    "completed_at": (activeJobResult as any).job.completed_at,
                    "falire_reason": (activeJobResult as any).job.falire_reason,
                })
            }

            const completedJobResult = await completedJob(details.repo_id)
            if ((completedJobResult as any).success === true) {
                return res.status(200).json({
                    "job_id": (completedJobResult as any).job.job_id,
                    "status": (completedJobResult as any).job.status,
                    "repo_id": (completedJobResult as any).job.repo_id,
                    "user_id": (completedJobResult as any).job.user_id,
                    "started_at": (completedJobResult as any).job.started_at,
                    "completed_at": (completedJobResult as any).job.completed_at,
                    "falire_reason": (completedJobResult as any).job.falire_reason,
                })
            }
        }
        //no matter what now we create jobs
        //(req as any).user = payload; inside middleware
        const jobObject: jobObject = {
            "repo_id": details.repo_id,
            "status": "PENDING"
        }

        const jobRecord: JobInterface = await createJob(jobObject);
        //here we are enqueuing the job into the analysis queue
        logger.info({
            "job_id": jobRecord.job_id,
            "repo_id": details.repo_id,
            "repo_url": repoUrl
        }, " JOB ENQUEUED START")
        await analysisQueue.add('repo_analysis_job', {
            "job_id": jobRecord.job_id,
            "repo_id": details.repo_id,
            "repo_url": repoUrl
        },);
        //  {
        //     attempts: 3,
        //     backoff: {
        //         type: "exponential",
        //         delay: 1000
        //     }
        // }
        logger.info({
            "job_id": jobRecord.job_id,
            "repo_id": details.repo_id,
            "repo_url": repoUrl
        }, " JOB ENQUEUED DONE")

        return res.status(200).json(jobRecord)

        //return res.status(200).json({ repo: details });
        //200 stuff went on fine
    }
    catch (err: any) {
        console.error("makeRepoRecord failed");

        console.error(err);

        if (err instanceof Error) {

            console.error("message:", err.message);

            console.error("stack:", err.stack);

        }

        return res.status(500).json({

            error: err?.message ?? "Unknown error"

        });
        //500 for database error
    }


}
export const listAnalyzedRepos = async (req: Request, res: Response) => {
    try {
        const repos = await getAnalyzedRepositories();
        res.json(repos);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? "Unknown error" });
    }
}

export const repoHistory = async (req: Request, res: Response) => {
    try {
        const { repoId } = req.params;
        const history = await getRepositoryHistory(repoId as string);
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: err?.message ?? "Unknown error" });
    }
}
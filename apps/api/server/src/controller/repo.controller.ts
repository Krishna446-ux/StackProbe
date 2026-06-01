import { createRepo } from '../services/repo.services'
import { createJob } from '../services/repo.services'
import { activeJob, completedJob } from '../services/repo.services'
import { RepoInterface } from '../interfaces/repoInterface'
import { JobInterface } from '../interfaces/jobInterface'
import { Request, Response } from 'express'
import { analysisQueue } from '../queues/analysis.queue'
interface jobObject {
    "repo_id": string;
    "status": string;
}
export const makeRepoRecord = async (req: Request, res: Response) => {
    const { repoUrl, force = false } = req.body;
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

            const activeJobResult = await activeJob(details.repo_id)
            if ((activeJobResult as any).success === true) {
                return res.status(200).json({
                    "job_id": (activeJobResult as any).job_id,
                    "status": (activeJobResult as any).status,
                })
            }

            const completedJobResult = await completedJob(details.repo_id)
            if ((completedJobResult as any).success === true) {
                return res.status(200).json({
                    "job_id": (completedJobResult as any).job_id,
                    "status": (completedJobResult as any).status,
                })
            }
        }
        //no matter what now we create jobs
        //(req as any).user = payload; inside middleware
        const jobObject: jobObject = {
            "repo_id": details.repo_id,
            "status": "PENDING"
        }
        //export  interface JobInterface{
        //     "job_id":'string';
        //     "repo_id":'string';
        //     "user_id":'string';
        //     "status":'string';
        //     "started_at":'date';
        //     "completed_at":'date';
        //     "faliure_reason":'string';
        // };

        const jobRecord: JobInterface = await createJob(jobObject);
        //here we are enqueuing the job into the analysis queue

        await analysisQueue.add('repo_analysis_job', {
            "job_id": jobRecord.job_id,
            "repo_id": details.repo_id,
            "repo_url": repoUrl
        }, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 1000
            }
        });
        console.log("done")
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

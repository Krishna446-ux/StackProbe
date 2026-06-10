//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import { ReportInstance } from '../interfaces/report_interface.js';
import logger from '../lib/logger.js'
import { setJobStatus } from '../repositories/jobRepository.js'
import { cloneRepo } from '../services/cloneRepo.js'
import fileSearcher from '../services/filesTracker.js'
import esLint from '../services/eslint.js'
import { calculateQualityScore } from '../services/calculateQualityScore.js'
import { reportFindings } from '../services/finding.js'
import { insertReport, updateSecurityScore } from '../repositories/reportRepository.js'
import OSVSecurityReport, { extractDependenciesFromPackageJson, extractDependenciesFromPackageLock } from '../services/OSVSecurityReport.js'
import fs from 'fs/promises'
import path from 'path';
import findings_interface from '../interfaces/findings_interface.js';
import { insertFindings } from '../repositories/findingRepository.js';

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
        "security_score": 100,
        "ai_summary": "haha, we will use ai later nerd",
    }
    //creates a report
    const report_id = await insertReport(generatedReport);
    //inserts report findings
    await reportFindings(report_id, eslint);

    //extracting the dependencies from the package,json

    let packageFiles = await fs.readdir(repoPath, {
        withFileTypes: true,
        recursive: true,
    });

    //finding all package.json, can be a bit array
    const packageLockFiles = packageFiles.filter(file => {
        return !file.parentPath.includes("node_modules") && /package-lock.json$/.test(file.name);
    });
    packageFiles = packageFiles.filter(file => {
        return !file.parentPath.includes("node_modules") && /package.json$/.test(file.name);
    });
    let security_report: { findings: findings_interface[], securityScore: number | null, scanCompleted: boolean } | null = null;
    if (packageLockFiles.length > 0) {
        // console.log(packageLockFiles)
        const dependencies = await extractDependenciesFromPackageLock(packageFiles);
        if (dependencies.length > 0) {
            security_report = await OSVSecurityReport(dependencies)

        }
    }
    else {
        // console.log(packageFiles, "Package")
        const dependencies = await extractDependenciesFromPackageJson(packageLockFiles);
        if (dependencies.length > 0) {
            security_report = await OSVSecurityReport(dependencies)
        }
    }
    if (security_report !== null) {

        logger.info("Security Report has been generated")
        //update security score
        await updateSecurityScore(report_id, security_report?.securityScore ?? null)
        logger.info("Inserting findings of security report")
        //inserting findings of security report
        await insertFindings(report_id, security_report.findings);
    }

    //create findings report, category is eslint and insert inside database



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
    const timer = timeout(10 * 60000);
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
        throw err
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
            logger.info(`Successfully deleted folder: ${directoryPath}`);
        } catch (err) {
            logger.error({ err, directoryPath }, "Failed to delete temporary repository");
        }
    }
}




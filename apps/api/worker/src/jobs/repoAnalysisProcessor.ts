//start from here writing the worker function, watch the video of chai aur code for finding what are queue events
import { ReportInstance } from '../interfaces/report_interface.js';
import logger from '../lib/logger.js'
import { setJobStatus, updateJobCurrentStage } from '../repositories/jobRepository.js'
import { cloneRepo } from '../services/cloneRepo.js'
import fileSearcher from '../services/filesTracker.js'
import esLint from '../services/eslint.js'
import { calculateQualityScore } from '../services/calculateQualityScore.js'
import { reportFindings } from '../services/reportFinding.js'
import { insertReport, updateSecurityScore, updateAiSummary } from '../repositories/reportRepository.js'
import OSVSecurityReport, { extractDependenciesFromPackageJson, extractDependenciesFromPackageLock, extractDependenciesFromPnpmLock, extractDependenciesFromYarnDirents } from '../services/OSVSecurityReport.js'
import fs from 'fs/promises'
import path from 'path';
import findings_interface from '../interfaces/findings_interface.js';
import { insertFindings } from '../repositories/findingRepository.js';
import aiSummaryRequest from '../services/generateAiSummary.js'
import Dependency from '../interfaces/dependency_interface.js';
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
    await updateJobCurrentStage(job.data.job_id, "CLONING")
    const repoPath: string = await cloneRepo(job.data.repo_url, job.data.job_id);

    // gives back list of files, but more importantly throws an error in case the repo does not has any js/ts/tsx/jsx files
    const files: string[] = await fileSearcher(job.data.job_id);
    //if (files.length === 0) //
    const eslint = await esLint(repoPath);
    logger.info("Calculating score")
    await updateJobCurrentStage(job.data.job_id, "QUALITY_ANALYSIS")
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
    const quality_findings = await reportFindings(report_id, eslint);

    //extracting the dependencies from the package,json

    const workingDirectory = await fs.readdir(repoPath, {
        withFileTypes: true,
        recursive: true,
    });

    //     export default interface Dependency {
    //     "packageName": string;
    //     "version": string;
    //     "isDev": boolean;
    // }

    //finding all package_lock.json, can be a bit array
    const packageLockFiles = workingDirectory.filter(file => {
        return !file.parentPath.includes("node_modules") && /package-lock.json$/.test(file.name);
    });
    // const packageFiles = workingDirectory.filter(file => {
    //     return !file.parentPath.includes("node_modules") && /package.json$/.test(file.name);
    // });

    //findings out pnpm-lock.yaml files
    const pnpmFiles = workingDirectory.filter(file => {
        return !file.parentPath.includes("node_modules") && /pnpm-lock.yaml$/.test(file.name);
    });

    //working out with 'yarn.lock' files

    const yarnFiles = workingDirectory.filter(file => {
        return !file.parentPath.includes("node_modules") && /yarn.lock$/.test(file.name);
    });

    let dependencies: Dependency[] = [];
    if (packageLockFiles.length > 0) {
        // console.log(packageLockFiles)
        dependencies = [...dependencies, ...(await extractDependenciesFromPackageLock(packageLockFiles)) ?? []];
    }
    // if (packageFiles.length > 0) {
    //     // console.log(packageFiles, "Package")
    //     dependencies = [...dependencies, ...(await extractDependenciesFromPackageJson(packageFiles))];

    // }
    if (pnpmFiles.length > 0) {
        dependencies = [...dependencies, ...(await extractDependenciesFromPnpmLock(pnpmFiles))];
    }

    if (yarnFiles.length > 0) {
        dependencies = [...dependencies, ...(await extractDependenciesFromYarnDirents(yarnFiles))];
    }

    let security_report: { findings: findings_interface[], securityScore: number | null, scanCompleted: boolean } | null = null;
    if (dependencies.length > 0) {
        //making sure that dependencies from all the files are not the same thing 
        const set = new Set<string>();
        dependencies = dependencies.filter(dependency => {
            const string = `${dependency.packageName}@${dependency.version}`;
            if (!set.has(string)) {
                set.add(string);
                return true;
            }
            return false;
        })
        await updateJobCurrentStage(job.data.job_id, "SECURITY_SCAN")
        security_report = await OSVSecurityReport(dependencies)
    }
    if (security_report?.scanCompleted) {

        logger.info("Security Report has been generated")
        //update security score
        await updateSecurityScore(report_id, security_report.securityScore)
        logger.info("Inserting findings of security report")
        //inserting findings of security report
        await insertFindings(report_id, security_report.findings);
    }
    else {
        await updateSecurityScore(report_id, -1)
        logger.warn("Security Report scan incomplete")
        //inserting findings of security report
        //await insertFindings(report_id, security_report?.findings);
    }

    //creating ai summary
    logger.info("Generating AI Summary")
    const findings = [...security_report?.findings ?? [], ...quality_findings];
    await updateJobCurrentStage(job.data.job_id, "AI_SUMMARY")
    const summary = await aiSummaryRequest(findings);
    console.log(JSON.stringify(summary, null, 2));
    const message = ((summary as any)?.candidates?.[0]?.content?.parts?.[0]?.text) ?? null;
    logger.info({ message }, "AI SUMMARY");
    logger.info("updating ai_summary inside the report")
    await updateAiSummary(report_id, message);

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




//  sdkHttpResponse: {
//       "headers": {
//         "alt-svc": "h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000",
//         "content-encoding": "gzip",
//         "content-type": "application/json; charset=UTF-8",
//         "date": "Wed, 10 Jun 2026 18:51:17 GMT",
//         "server": "scaffolding on HTTPServer2",
//         "server-timing": "gfet4t7; dur=6096",
//         "transfer-encoding": "chunked",
//         "vary": "Origin, X-Origin, Referer",
//         "x-content-type-options": "nosniff",
//         "x-frame-options": "SAMEORIGIN",
//         "x-gemini-service-tier": "standard",
//         "x-xss-protection": "0"
//       }
//     }
//     candidates: [
//       {
//         "content": {
//           "parts": [
//             {
//               "text": "The repository analysis primarily identified several instances of \"Generic Object Injection Sink\" and \"Variable Assigned to Object Injection Sink\" across multiple files, particularly within cryptography and algorithm implementations. While these findings are categorized as low severity quality issues, the underlying rule `security/detect-object-injection` indicates a potential security concern that warrants attention, as object injection vulnerabilities can lead to severe exploits.\n\nObject Injection Sinks represent critical points where an attacker might manipulate data structures or execute arbitrary code by injecting malicious objects. This could compromise data integrity, lead to unauthorized system access, or facilitate denial-of-service attacks. The presence of these issues in core algorithmic components, even if currently low severity, introduces engineering risk by creating potential attack vectors that could impact the reliability and security of computations and data processing.\n\nTo address these findings, it is recommended to: (1) Implement rigorous input validation and sanitization for all identified object injection sinks, ensuring only expected data types and structures are processed. (2) Conduct a targeted security audit on the affected cryptography and algorithm files to fully assess the exploitability and potential impact of these vulnerabilities. (3) Integrate more comprehensive static application security testing (SAST) tools or configurations that specifically highlight and prioritize such security-related quality issues to prevent their introduction in the future."
//             }
//           ],
//           "role": "model"
//         },
//         "finishReason": "STOP",
//         "index": 0
//       }
//     ]
//     modelVersion: "gemini-2.5-flash"
//     responseId: "H7Ipar3vGaeBqfkPk4qn2Ao"
//     usageMetadata: {
//       "promptTokenCount": 1603,
//       "candidatesTokenCount": 260,
//       "totalTokenCount": 2541,
//       "promptTokensDetails": [
//         {
//           "modality": "TEXT",
//           "tokenCount": 1603
//         }
//       ],
//       "thoughtsTokenCount": 678,
//       "serviceTier": "standard"
//     }
// reposible for clowing 
import { spawn } from 'node:child_process'
import path from 'path';
import logger from '../lib/logger.js'
import fs from 'node:fs/promises'
const projectRoot = process.cwd();// cwd stands current working directory, basically gives absolute address to the worker
export const cloneRepo = async (repoUrl: string, jobId: string): Promise<string> => {

    // join function joins these parts using forward slashes for mac, and backslashes for window
    logger.info("Cloning of repo started")
    const clonePath = path.join(projectRoot, "tmp", "stackprobe", jobId);
    const timeout = setTimeout(() => {
        child.kill("SIGKILL");
    }, 2 * 60000);
    await fs.mkdir(path.dirname(clonePath), { recursive: true });

    // this spawn function returns immediately, this is not a promise, so how do we make sure the process waits for the clone to finish ? By converting it into a promise which only resolves in case the function succeeds
    const child = spawn('git', ["clone", "--depth", "1", repoUrl, clonePath]);
    let stderr: string = "";
    return new Promise((resolve, reject) => {
        //it says stderr. 
        child.stdout.on('data', (chunks) => {
            logger.info({ stderr: chunks.toString() }, "Clone stderr");
        })
        child.stderr.on('data', (chunks) => {
            stderr += chunks.toString();
            logger.info({ stderr: chunks.toString() });
        })
        child.on('error', (err) => {
            reject(err);
        })
        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                logger.info("Repo Cloned Successfully")

                resolve(clonePath);
            }
            // here the in case the clone fails, we send out the stderr wrapped it around the error, in this way
            // it will propogate as an error to become the faliure reason 
            else reject(new Error(stderr || "Something went wrong while cloning the repo"));
        })
    })
}
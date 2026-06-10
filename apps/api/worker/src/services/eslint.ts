import { execFile } from 'node:child_process'
import { promisify } from 'util'
import logger from '../lib/logger.js'

async function esLint(repoPath: string) {
    logger.info("Eslint static analysis started")
    try {
        //const timer = setTimeout(() => { throw new Error("ES Lint Time Limit Exceeded") }, 30000)
        //since the promisify converts the execFile function (which is not a promise but rather callback based),converted into a promise
        const execFilePromise = promisify(execFile);
        //
        const { stdout } = await execFilePromise('eslint', [".", "--config", "../../../eslint.config.js", "--format", "json"], {
            cwd: repoPath,
            timeout: 2 * 60000,
            maxBuffer: 100 * 1024 * 1024,
        });
        logger.info("Eslint static finished")
        return JSON.parse(stdout);
    }
    catch (err: any) {
        if (err.code === 1) {
            return JSON.parse(err.stdout);
        }
        logger.error({ err }, "ES Lint error object")
        throw err;
    }

}
export default esLint;
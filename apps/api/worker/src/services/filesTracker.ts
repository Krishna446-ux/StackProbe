import { glob } from "glob";
import path from 'path'
import logger from '../lib/logger'
const projectPath = process.cwd();
async function fileSearcher(jobId: string): Promise<string[]> {
    logger.info("Searching for all files and checking if ts/js files present")
    const filePath = path.join(projectPath, "tmp", "stackprobe", jobId);
    try {
        const files = await glob("**/*.{js,ts,tsx,jsx}", {
            cwd: filePath,
            ignore: ["**/node_modules/**", "**/.git/**"]
        });
        logger.info({ count: files.length }, "JS/TS files discovered");
        return files;
    }
    catch (err: any) {
        logger.error({ err }, "Files could not be serched");
        throw err;
    }

}
export default fileSearcher
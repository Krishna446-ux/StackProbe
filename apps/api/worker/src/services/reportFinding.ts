import findings_interface from '../interfaces/findings_interface.js'
import { insertFindings } from '../repositories/findingRepository.js'
import logger from '../lib/logger.js'
// export interface findings_interface {
//     "category": string;
//     "severity": string;
//     "message": string;
//     "file_path": string;
//     "rule": string;
// };
export async function reportFindings(report_id: string, esLint: any): Promise<findings_interface[]> {
  try {
    let res: findings_interface[] = [];
    // 1 is for warning and 2 is for error
    const SEVERITY_MAP = {
      1: 'low',
      2: 'high'
    };
    for (const files of esLint) {
      const tmp = files.messages.map((msg: any) => {
        return {
          "category": "quality",
          "severity": SEVERITY_MAP[msg.severity as 1 | 2],
          "message": msg.message,
          "filePath": files.filePath,
          "rule": msg.ruleId,
        }
      })
      res = [...res, ...tmp];
    }
    await insertFindings(report_id, res);
    return res;
  }
  catch (err: any) {
    logger.info({ err }, "Issue in in creating the findings array or inserting it")
    throw err;
  }
};

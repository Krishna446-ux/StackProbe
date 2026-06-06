import { findings_interface } from '../interfaces/findings_interface'
import { insertFindings } from '../repositories/findingRepository'
import logger from '../lib/logger'
// export interface findings_interface {
//     "category": string;
//     "severity": string;
//     "message": string;
//     "file_path": string;
//     "rule": string;
// };
async function findings(report_id: string, esLint: any) {
  try {
    let res: findings_interface[] = [];
    const SEVERITY_MAP = {
      1: 'LOW',
      2: 'HIGH'
    };
    for (const files of esLint) {
      let tmp = files.messages.map((msg: any) => {
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
  }
  catch (err: any) {
    logger.info({ err }, "Issue in in creating the findings array or inserting it")
    throw err;
  }
}

export default findings;
/*
[
  {
    "filePath": "/app/src/workers/videoProcessor.js",
    "errorCount": 2,
    "warningCount": 0,
    "fatalErrorCount": 0,
    "fixableErrorCount": 1,
    "fixableWarningCount": 0,
    "messages": [
      {
        "ruleId": "@typescript-eslint/no-unused-vars",
        "severity": 2,
        "message": "'result' is assigned a value but never used.",
        "line": 14,
        "column": 9,
        "nodeType": "Identifier",
        "messageId": "unusedVar",
        "endLine": 14,
        "endColumn": 15
      },
      {
        "ruleId": "complexity",
        "severity": 2,
        "message": "Function 'processVideo' has a complexity of 14 (max 10).",
        "line": 42,
        "column": 22,
        "nodeType": "FunctionDeclaration",
        "endLine": 65,
        "endColumn": 2
      }
    ],
    "suppressedMessages": []
  },
  {
    "filePath": "/app/src/utils/db.js",
    "errorCount": 0,
    "warningCount": 1,
    "fatalErrorCount": 0,
    "fixableErrorCount": 0,
    "fixableWarningCount": 0,
    "messages": [
      {
        "ruleId": "no-console",
        "severity": 1,
        "message": "Unexpected console statement.",
        "line": 5,
        "column": 12,
        "nodeType": "MemberExpression",
        "messageId": "unexpected",
        "endLine": 5,
        "endColumn": 23
      }
    ],
    "suppressedMessages": []
  }
]
*/
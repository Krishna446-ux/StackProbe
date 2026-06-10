import pool from "../lib/db.js";
import logger from '../lib/logger.js'
import findings_interface from "../interfaces/findings_interface.js";
export async function insertFindings(report_id: string, findings: findings_interface[]) {
    findings = findings.slice(0, 500);
    logger.info("Inserting findings into database")
    //optmise later into by converting this into only one query 
    try {
        for (const finding of findings) {
            await pool.query(
                `
        INSERT INTO findings
        ("report_id", "category", "severity", "rule", "message", "filePath")
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
                [
                    report_id,
                    finding.category,
                    finding.severity,
                    finding.rule,
                    finding.message,
                    finding.filePath
                ]
            );
        }
        logger.info("Inserted findings")
    } catch (err: any) {
        logger.error({ err }, "Error inserting findings");
        throw err;
    }
}
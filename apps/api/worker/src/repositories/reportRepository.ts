import { ReportInstance } from '../interfaces/report_interface.js';
import logger from '../lib/logger.js'
import pool from '../lib/db.js'
export async function insertReport(report: ReportInstance): Promise<string> {
    try {
        logger.info("Inserting report into database")
        const { rows } = await pool.query("insert into reports (job_id,quality_score,security_score,ai_summary) values ($1,$2,$3,$4) RETURNING *",
            [report.job_id, report.quality_score, report.security_score, report.ai_summary])
        return rows[0].report_id
    }
    catch (err: any) {
        logger.error({ err }, "Error inserting report");
        throw err;
    }
}

export async function updateSecurityScore(reportId: string, securityScore: number | null) {
    try {

        logger.info("Updating score in report")
        const { rows } = await pool.query("update reports set security_score=$1,scan_completed=true where report_id=$2 RETURNING *",
            [securityScore, reportId])
        if (rows.length === 0) {
            throw new Error(
                `Report ${reportId} not found`
            );
        }
        return rows[0].report_id
    }
    catch (err: any) {
        logger.error({ err }, "Error updating security score in report");
        throw err;
    }
}
export async function updateAiSummary(reportId: string, aiSummary: string | null) {
    if (aiSummary === null) {
        aiSummary = "AI Summary is Unavailable";
    }
    try {

        logger.info("Updating AI Summary in report")
        const { rows } = await pool.query("update reports set ai_summary=$1,scan_completed=true where report_id=$2 RETURNING *",
            [aiSummary, reportId])
        if (rows.length === 0) {
            throw new Error(
                `Report ${reportId} not found`
            );
        }
        return rows[0].report_id
    }
    catch (err: any) {
        logger.error({ err }, "Error updating AI Summary in report");
        throw err;
    }

}
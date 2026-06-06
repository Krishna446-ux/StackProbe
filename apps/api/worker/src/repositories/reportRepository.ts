import { ReportInstance } from '../interfaces/report_interface';
import logger from '../lib/logger'
import pool from '../lib/db'
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

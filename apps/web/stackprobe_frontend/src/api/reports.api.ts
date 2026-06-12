import { apiGet } from './client';
import type { Finding } from '../types/dashboard.types';

/**
 * Fetch a report by its ID. Returns the full report object.
 * The report shape is not strictly typed since it comes from the
 * backend with dynamic fields (ai_summary, quality_score, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getReport(reportId: string): Promise<any> {
  return apiGet<any>(`/api/reports/${reportId}`);
}

/**
 * Fetch findings for a given report.
 */
export async function getReportFindings(reportId: string): Promise<Finding[]> {
  return apiGet<Finding[]>(`/api/reports/${reportId}/findings`);
}

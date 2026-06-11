import { apiGet } from './client';
import type { Job } from '../types/job.types';

/**
 * Fetch a single job by ID.
 * export interface Job {
  job_id: string;
  repo_id: string;
  user_id: string;
  status: string;
  started_at: Date;
  completed_at: Date;
  faliure_reason: string;
}
*/

export async function getJob(jobId: string): Promise<Job> {
  return apiGet<Job>(`/jobs/${jobId}`);
}

/**
 * Fetch the worker's real current stage for a job.
 * Returns values: PENDING | CLONING | QUALITY_ANALYSIS | SECURITY_SCAN | AI_SUMMARY | COMPLETE | FAILED
 */
export async function getJobCurrentStage(jobId: string): Promise<{ current_stage: string }> {
  return apiGet<{ current_stage: string }>(`/job/currentStage/${jobId}`);
}

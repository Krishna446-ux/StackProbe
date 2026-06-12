import { apiGet } from './client';
import type { Job } from '../types/job.types';

export interface WorkerHealth {
  status?: string;
}

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
  return apiGet<Job>(`/api/jobs/${jobId}`);
}

/**
 * Fetch the worker's real current stage for a job.
 * Returns values: PENDING | CLONING | QUALITY_ANALYSIS | SECURITY_SCAN | AI_SUMMARY | COMPLETE | FAILED
 */
export async function getJobCurrentStage(jobId: string): Promise<string> {
  return apiGet<string>(`/api/job/currentStage/${jobId}`);
}

/**
 * Check whether the background worker process is healthy.
 * Called periodically during polling so the UI can surface a meaningful
 * error instead of silently stalling when the worker has crashed.
 */
export async function getWorkerHealth(): Promise<WorkerHealth> {
  return apiGet<WorkerHealth>('/api/health/worker/');
}

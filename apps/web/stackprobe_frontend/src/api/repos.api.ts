import { apiGet, apiPost } from './client';
import type { AnalyzedRepo, ScoreHistoryPoint } from '../types/dashboard.types';
import type { SubmitRepoRequest } from '../types/repo.types';

/**
 * Fetch all analyzed repositories for the current user.
 */
export async function getAnalyzedRepos(): Promise<AnalyzedRepo[]> {
  return apiGet<AnalyzedRepo[]>('/api/repos/analyzed');
}

/**
 * Submit a GitHub repository URL for analysis.
 * Returns the created job payload (contains job_id).
 */
export async function submitRepo(request: SubmitRepoRequest): Promise<{ job_id: string }> {
  return apiPost<{ job_id: string }>('/api/repos', request);
}

/**
 * Fetch score history for a specific repository.
 */
export async function getRepoHistory(repoId: string): Promise<ScoreHistoryPoint[]> {
  return apiGet<ScoreHistoryPoint[]>(`/api/repos/${repoId}/history`);
}

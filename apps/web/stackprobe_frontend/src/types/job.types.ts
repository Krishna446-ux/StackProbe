export interface Job {
  job_id: string;
  repo_id: string;
  user_id: string;
  status: string;
  started_at: Date;
  completed_at: Date;
  faliure_reason: string;
}

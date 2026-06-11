export interface AnalyzedRepo {
  repo_id: string;
  owner: string;
  name: string;
  report_id: string;
  quality_score: number;
  security_score: number;
  analysis_date: string;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface Finding {
  finding_id: string;
  report_id: string;
  category: string;
  severity: string; // CRITICAL, HIGH, MEDIUM, LOW, or lowercase
  rule: string;
  message: string;
  filePath: string;
}

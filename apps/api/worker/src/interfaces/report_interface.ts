export interface ReportInstance {
    "job_id": string;
    "quality_score": number;
    "security_score": number;
    "ai_summary": string;
}
export interface Report {
    "report_id": string;
    "job_id": string;
    "quality_score": number;
    "security_score": number;
    "ai_summary": string;
    "created_at": Date;
}

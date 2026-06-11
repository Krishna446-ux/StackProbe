export interface OSVQueryVuln {
    "id": string;
    "modified": string;
}
export interface OSVQueryResult {
    "vulns": OSVQueryVuln[];
}
export default interface OSVResponse {
    "results": OSVQueryResult[]
};
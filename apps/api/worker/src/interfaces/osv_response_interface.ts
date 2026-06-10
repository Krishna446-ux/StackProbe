interface OSVQueryVuln {
    "id": string;
    "modified": string;
}
interface OSVQueryResult {
    "vulns": OSVQueryVuln[];
}
export default interface OSVResponse {
    "results": OSVQueryResult[]
};
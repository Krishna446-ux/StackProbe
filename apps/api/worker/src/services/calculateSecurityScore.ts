import findings_interface from "../interfaces/findings_interface.js";

export default function computeSecurityScore(
    findings: findings_interface[]
) {
    if (findings.length === 0) return 100;

    const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    };

    for (const finding of findings) {
        switch (finding.severity?.toLowerCase()) {
            case "critical":
                counts.critical++;
                break;
            case "high":
                counts.high++;
                break;
            case "medium":
                counts.medium++;
                break;
            case "low":
                counts.low++;
                break;
        }
    }

    const penalty =
        Math.log1p(counts.critical) * 40 +
        Math.log1p(counts.high) * 15 +
        Math.log1p(counts.medium) * 5 +
        Math.log1p(counts.low) * 1;

    return Math.max(
        0,
        Math.min(100, Math.round(100 - penalty))
    );
}
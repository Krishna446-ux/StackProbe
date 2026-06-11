import findings_interface from "../interfaces/findings_interface.js";

export default function computeSecurityScore(findings: findings_interface[]) {
    if (findings.length === 0) return 100;
    const weight = {
        'critical': 10,
        'high': 5,
        'medium': 2,
        'low': 1,
        "unknown": 0,
    }
    let res = 0; let critical = 0; let high = 0; let medium = 0; let low = 0;
    for (const finding of findings) {
        if (finding.severity === 'critical') critical++;
        else if (finding.severity === 'high') high++;
        else if (finding.severity === 'medium') medium++;
        else if (finding.severity === 'low') low++;
    }
    res += Math.log(critical + 1) * weight['critical'] + Math.log(high + 1) * weight['high'] + Math.log(medium + 1) * weight['medium'] + Math.log(low + 1) * weight['low'];
    return Math.max(0, Math.floor(100 - res));
}
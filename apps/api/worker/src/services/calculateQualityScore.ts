export function calculateQualityScore(eslintJsonData: any[]) {
    let weightedPenalty = 0;

    for (const file of eslintJsonData) {
        for (const msg of file.messages) {
            const severity = msg.severity;

            if (severity === 2) {
                weightedPenalty += 3;
            } else if (severity === 1) {
                weightedPenalty += 1;
            }
        }
    }

    const score = Math.round(
        100 - (20 * Math.log10(1 + weightedPenalty))
    );

    return Math.max(0, Math.min(100, score));
}
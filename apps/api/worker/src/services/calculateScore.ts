import logger from '../lib/logger'
export function calculateQualityScore(eslintJsonData: any) {
    let totalFiles = eslintJsonData.length;

    // If the repo is completely empty, give it a perfect score
    if (totalFiles === 0) return 0;

    let totalErrors = 0;
    let totalWarnings = 0;
    let complexFunctionsCount = 0;

    // 1. Loop through every file node in the tree
    for (const file of eslintJsonData) {
        logger.info(file);
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;

        // 2. Look inside the messages to catch specific architectural issues like complexity
        for (const msg of file.messages) {
            if (msg.ruleId === 'complexity') {
                complexFunctionsCount++;
            }
        }
    }

    // 3. Calculate total penalty deductions
    const errorPenalty = totalErrors * 5;
    const warningPenalty = totalWarnings * 1;
    const complexityPenalty = complexFunctionsCount * 10;

    const totalDeduction = errorPenalty + warningPenalty + complexityPenalty;

    // 4. Calculate a relative score so large repos aren't punished unfairly compared to tiny repos
    // We divide the deductions by the number of files to get an "average penalty per file"
    const penaltyPerFile = totalDeduction / totalFiles;

    // Start at 100 and subtract the penalty per file (scaled up so it hits the score noticeably)
    let finalScore = Math.round(100 - (penaltyPerFile * 2));

    // 5. Cap the score between 0 and 100
    finalScore = Math.max(0, Math.min(100, finalScore));



    return finalScore;
}

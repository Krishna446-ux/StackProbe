import findings_interface from "../interfaces/findings_interface.js";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import 'dotenv/config'
import logger from "../lib/logger.js";
const ai = new GoogleGenAI({});
function score(findings: findings_interface) {
    let score = 0;
    if (findings.category === 'security') score += 100;
    switch (findings.severity) {
        case 'critical':
            score += 40;
            break;
        case 'high':
            score += 30;
            break;
        case 'medium':
            score += 20;
            break;
        case 'low':
            score += 10;
            break;
        default:
            break;
    }
    return score;
}
export default async function aiSummaryRequest(findings: findings_interface[]) {
    //finding top 10
    findings.sort((a, b) => {
        return score(a) - score(b);
    })
    //top 10 findings;
    const topFindings: findings_interface[] = findings.slice(0, Math.min(10, findings.length));
    const prompt = `Generate a 3-paragraph executive summary of the repository analysis.

                Requirements:

                - Prioritize security findings over quality findings.

                - Focus on the most severe issues.

                - Explain why the issues matter.

                - Recommend 2-3 practical next steps.

                - Do not invent findings.

                Findings:

                ${JSON.stringify(topFindings, null, 2)}


                `;
    const instruction = `
                <role>
                You are a senior software engineer performing repository reviews.
                </role>

                <instructions>
                1. Analyze the provided findings.
                2. Prioritize security issues over quality issues.
                3. Focus on the most impactful problems first.
                4. Explain engineering and business impact.
                5. Recommend practical fixes.
                6. Only use information present in the findings.
                </instructions>

                <constraints>
                - Maximum 3 paragraphs.
                - Professional tone.
                - Concise and actionable.
                - Avoid repetition.
                </constraints>

                <output_format>
                Paragraph 1:
                Executive summary of the most important issues.

                Paragraph 2:
                Potential risks and impact.

                Paragraph 3:
                2-3 recommended next steps.
                </output_format>
                `;
    let aiTimeout
    try {
        const timeoutPromise = new Promise((__resolve, reject) => {
            aiTimeout = setTimeout(() => {
                reject("TimeLimit Exceeded For AI Summary");
            }, 10000)
        })

        const response = await Promise.race([ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {

                systemInstruction: instruction,
            }
        }
        ), timeoutPromise]);
        //dynamic loading

        clearTimeout(aiTimeout);
        logger.info(response, "AI Summary");
        return response;
    }
    catch (err: any) {
        logger.error(err);
        return "AI Summary Unavailable";
    }

}
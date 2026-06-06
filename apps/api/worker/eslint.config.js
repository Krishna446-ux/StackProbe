import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginSecurity from "eslint-plugin-security";

export default [
    // 1. Tell ESLint which files to analyze and what to ignore
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        ignores: ["**/node_modules/**", "**/dist/**", "**/.git/**"]
    },

    // 2. Load Base Configurations
    pluginJs.configs.recommended,                  // Standard JS rules
    ...tseslint.configs.recommended,     // Deep TypeScript structural checks
    pluginSecurity.configs.recommended,             // Flags regex dos, eval, injection flaws

    // 3. Setup TypeScript Parser Options
    {
        languageOptions: {
            parserOptions: {
                project: false,                            // Uses your tsconfig.json automatically
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    // 4. Custom Quality Scoring Overrides
    {
        rules: {
            // Quality Metrics: Throw errors on messy code
            "no-unused-vars": "off",                     // Turn off JS version to let TS handle it
            "@typescript-eslint/no-unused-vars": "error", // Unused variables crash the quality score
            "no-console": "warn",                        // Warn if production code leaves console.logs
            "complexity": ["error", { max: 10 }],         // 🔴 Crucial for scoring: Flags functions with too many nested if/else loops

            // Safety & Architecture
            "@typescript-eslint/no-explicit-any": "error", // Banning 'any' keeps the TS score honest
        },
    },
];
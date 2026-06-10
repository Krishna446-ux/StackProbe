import tseslint from "typescript-eslint";
import pluginSecurity from "eslint-plugin-security";
import js from "@eslint/js";
export default [
    { ignores: ["**/node_modules/**", "**/dist/**", "**/.git/**"] },
    // 1. Tell ESLint which files to analyze and what to ignore
    {
        // Target standard JS scripts, ES Modules, and React JavaScript components
        files: ["**/*.js", "**/*.mjs", "**/*.jsx"],
        ...js.configs.recommended, // Applies standard ECMAScript linting package 
        languageOptions: {
            //automatically applied espree eslinting
            ecmaVersion: "latest",// otherwise eslint might reject newer syntax
            sourceType: "module", // Allows 'import/export' blocks in .mjs and modern .js
            parserOptions: {
                ecmaFeatures: {
                    jsx: true, // Allows the parser to understand HTML-in-JS syntax for .jsx files <div>Hello WOrld</div> otherwise it will say unexpected token <
                },
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off", // Keeps your server-side logging intact
        },
    },
    ...tseslint.configs.recommended.map(config => ({
        ...config,
        // 1. Target the files once
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            // TRAP 1 FIX: Turn off the base JS rule so it stops double-reporting
            "no-unused-vars": "off",

            // TRAP 2 FIX: Put your custom TS rules right here in the same block!
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
        },
    })),
    pluginSecurity.configs.recommended
];
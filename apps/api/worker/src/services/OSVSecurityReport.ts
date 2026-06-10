//we can directly import packageJson, since packageJson is just an object
import semver from 'semver';
import Dependency from '../interfaces/dependency_interface.js';
import logger from '../lib/logger.js'
import OSVResponse from '../interfaces/osv_response_interface.js';
import path from 'path'
import { Dirent } from 'fs';
import fs from 'fs/promises';
import findings_interface from '../interfaces/findings_interface.js';
// Now you can access dependencies directly!
//This returns an array of key value pair, extracted from an object


function isQueryableVersion(dependency: Dependency): boolean {
    if (typeof dependency.version !== 'string' || !dependency.version.trim()) return false;
    if (typeof dependency.packageName !== 'string' || !dependency.packageName.trim()) return false;
    //The .trim() method removes whitespace from both the beginning and the end of a string.
    const version = dependency.version.trim();
    // 1. REJECT: Absolute Wildcard
    if (version === '*') return false;

    // 2. REJECT: Monorepo Workspaces
    if (version.startsWith('workspace:')) return false;

    // 3. REJECT: Local Hardcoded Files
    if (version.startsWith('file:')) return false;

    // 4. REJECT: Direct Git / GitHub URLs
    // '/'this means at the very start of the string, '+' signs means match the previous character one or more times, '\' means do not use that superpower
    if (/^(git|git\+ssh|git\+https|http|https|github):/i.test(version) || version.includes('.git')) return false;
    // 5. REJECT: Standalone Git Commit SHA hashes, Basically points to a snapshot of code
    // Catches 7-character short hashes or 40-character full hashes
    if (/^[0-9a-f]{7}$/i.test(version) || /^[0-9a-f]{40}$/i.test(version)) {
        return false;
    }
    // 6. VERIFY: Standard SemVer Range
    // semver.validRange() checks if it's a valid pattern like ^1.2.0, ~4.5.1, or 2.0.0
    // If it's valid, it returns a cleaned string; if it's invalid, it returns null.
    return semver.validRange(version) !== null;
}
//https://api.osv.dev/v1/querybatch
function buildOSVBatchRequest(dependencies: Dependency[]) {
    //{ "package": { "name": "jinja2", "ecosystem": "npm" }, "version": "3.1.4" }
    const array = dependencies.map(dependency => {
        return {
            "package": {
                "name": dependency.packageName,
                "ecosystem": "npm"
            },
            "version": dependency.version
        }
    })
    return {
        "queries": array
    }
}
function computeSecurityScore(findings: findings_interface[]) {
    if (findings.length === 0) return 100;
    const weight = {
        'critical': 10,
        'high': 5,
        'medium': 2,
        'low': 1,
        "unknown": 0,
    }
    let res = 0;
    for (const finding of findings) {
        res += (weight as any)[finding.severity]
    }
    return Math.max(0, 100 - res);
}
export async function extractDependenciesFromPackageJson(packageJsonPath: Dirent[]): Promise<Dependency[]> {
    let dependencies: Dependency[] = []
    for (const obj of packageJsonPath) {
        //for each package.json, we are creating a path to it, then importing
        const pathToJson = path.join(obj.parentPath, "package.json");
        const raw = await fs.readFile(pathToJson, { encoding: "utf8" });

        const packageJson = JSON.parse(raw);

        //creating the dependencies array, basically it contains the dependencies and devDependencies of package.json of the cloned repo
        let dependenciesPart1: Dependency[];
        let dependenciesPart2: Dependency[];
        //hasOwn is used to check if key is present or not, gives boolean value
        if (Object.hasOwn(packageJson, 'dependencies')) {
            dependenciesPart1 = (Object.entries(packageJson.dependencies)).map(ele => {
                return {
                    "packageName": ele[0],
                    "version": ele[1] as string,
                    "isDev": false
                }
            })
            dependencies = [...dependencies, ...dependenciesPart1];
        }
        if (Object.hasOwn(packageJson, 'devDependencies')) {
            dependenciesPart2 = (Object.entries(packageJson.devDependencies)).map(ele => {
                return {
                    "packageName": ele[0],
                    "version": ele[1] as string,
                    "isDev": true
                }
            })
            dependencies = [...dependencies, ...dependenciesPart2];
        }
    }
    return dependencies;
}

export async function extractDependenciesFromPackageLock(packageLockJsonPath: Dirent[]): Promise<Dependency[]> {
    const masterResults: Dependency[] = [];

    // Loop through each discovered lockfile element
    for (const lockfileEntry of packageLockJsonPath) {
        try {
            // 1. Securely construct the absolute path to this specific lockfile
            const absoluteLockfilePath = path.join(lockfileEntry.parentPath, "package-lock.json");

            // 2. Read and parse the target file contents
            const rawData = await fs.readFile(absoluteLockfilePath, 'utf-8');
            const lockfile = JSON.parse(rawData);
            const packages = lockfile.packages;

            if (!packages) {
                logger.warn(`Skipping ${absoluteLockfilePath}: Missing "packages" tree architecture.`);
                continue;
            }

            // 3. Target the core dependencies declarations for this specific folder
            const rootDeps = packages[""]?.dependencies ?? {};
            const rootDevDeps = packages[""]?.devDependencies ?? {};

            // 4. Extract standard dependencies
            Object.keys(rootDeps).forEach((depName) => {
                const installedBlock = packages[`node_modules/${depName}`];
                if (installedBlock?.version) {
                    masterResults.push({
                        packageName: depName,
                        version: installedBlock.version,
                        isDev: false,

                    });
                }
            });

            // 5. Extract development dependencies
            Object.keys(rootDevDeps).forEach((depName) => {
                const installedBlock = packages[`node_modules/${depName}`];
                if (installedBlock?.version) {
                    masterResults.push({
                        packageName: depName,
                        version: installedBlock.version,
                        isDev: true,
                    });
                }
            });

        } catch (err: any) {
            // Catch errors for an individual broken/corrupted lockfile so it doesn't crash the entire loop
            logger.error(`Failed parsing a lockfile entry: ${err.message}`);
        }
    }

    return masterResults;
}
async function OSVSecurityReport(dependencies: Dependency[]): Promise<{ findings: findings_interface[], securityScore: number | null, scanCompleted: boolean }> {
    //Dirent {
    //   name: 'cat.json',
    //   parentPath: '/Users/krishnasinghparmar/Desktop/test/folder1/folder2',
    //   path: '/Users/krishnasinghparmar/Desktop/test/folder1/folder2',
    //   [Symbol(type)]: 1

    let timer;
    try {
        // the parameters contains dirent, which is basically an array of objects,containing the info of the file package.json



        //removing dupicates, since there are multiple package.json
        const set = new Set<string>();
        dependencies = dependencies.filter(dependency => {
            // basically dependency package name and version, if both are same, then we ought to remove it

            const setString = `${dependency.packageName}@${dependency.version}`;
            if (set.has(setString)) return false;
            set.add(setString);
            return true;
        })

        //filter out all good ones
        dependencies = dependencies.filter(isQueryableVersion);
        if (dependencies.length === 0) {
            logger.warn("No dependencies found")
            return {
                findings: [],
                securityScore: 100,
                scanCompleted: true,
            };
        }
        logger.warn(dependencies, "dependencies found")

        const batchRequest = buildOSVBatchRequest(dependencies);


        const controller = new AbortController();
        timer = setTimeout(() => { controller.abort() }, 60000);

        const response = await fetch("https://api.osv.dev/v1/querybatch", {
            signal: controller.signal,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(batchRequest),
        });

        // 1. FIX: Catch HTTP errors (400, 500, etc.) immediately
        if (!response.ok) {
            const errorText = await response.text();
            const err = new Error(errorText);
            err.name = "HTTPError"
            throw err;
        }
        //as is used for typecasting
        const data = (await response.json());
        // console.log("Dependencies:");
        // console.log(dependencies.slice(0, 20));

        // console.log("Batch Request:");
        // console.log(JSON.stringify(batchRequest, null, 2));
        //now these vulnerabilities, have only id and modified, which is not sufficient for any security report
        //for now we are making request back to osv for each of these vulnerabilities, optimise in future


        const findings: findings_interface[] = [];
        // export interface findings_interface {
        //     "category": string;
        //     "severity": string;
        //     "message": string;
        //     "filePath": string;
        //     "rule": string;
        // };
        // 2. FIX: Fallback to an empty array if no vulnerabilities are found
        // This prevents 'undefined' leakage to the rest of StackProbe
        if ((data as any).results.length === 0) {
            logger.warn("No security issues found")
            return {
                findings: [],
                securityScore: 100,
                scanCompleted: true
            }
        }
        const advisoryIds = [
            ...new Set(
                (data as any).results.flatMap((result: any) =>
                    (result?.vulns ?? []).map((vuln: any) => vuln.id).filter(Boolean)
                )
            )
        ];
        const advisoryFindings = await Promise.all(
            advisoryIds.map(async (advisoryId): Promise<findings_interface | null> => {
                try {
                    const heavy = await fetch(`https://api.osv.dev/v1/vulns/${advisoryId}`);
                    if (!heavy.ok) {
                        const errorText = await heavy.text();
                        logger.error((`Failed to fetch advisory ${advisoryId},error: ${errorText}`));
                        return null;
                    }
                    logger.info((`Fetched advisory ${advisoryId}`));
                    const { id, summary, database_specific } = await heavy.json() as any;
                    let severity;
                    if (!database_specific?.severity) {
                        severity = "unknown";
                    }
                    else if (database_specific.severity === "MODERATE") {
                        severity = "medium";
                    }
                    else {
                        severity = database_specific.severity.toLowerCase();
                    }
                    return {
                        "category": "security",
                        "severity": severity,
                        "message": summary,
                        "filePath": "",
                        "rule": id,
                    }
                }
                catch (err: any) {
                    logger.error({ err }, `Error while fetching advisory ${advisoryId}`);
                    return null;
                }
            })
        );
        findings.push(...advisoryFindings.filter((finding): finding is findings_interface => finding !== null));
        return {
            "findings": findings,
            "securityScore": computeSecurityScore(findings),
            "scanCompleted": true,
        }

    }
    catch (err: any) {
        logger.error({ err }, "Error while fetching dependencies, getDependencies function")
        if (err?.name === 'AbortError') {
            logger.warn("OSV request timed out");
            return {
                findings: [],
                securityScore: null,
                scanCompleted: false
            }
        }

        return {
            findings: [],
            securityScore: null,
            scanCompleted: false
        }

    }
    finally {

        clearTimeout(timer);

    }
}
export default OSVSecurityReport

//we can directly import packageJson, since packageJson is just an object
import semver from 'semver';
import Dependency from '../interfaces/dependency_interface.js';
import logger from '../lib/logger.js'
import path from 'path'
import { Dirent } from 'fs';
import fs from 'fs/promises';
import findings_interface from '../interfaces/findings_interface.js';
import yaml from 'yaml';
import yarnLockfile from '@yarnpkg/lockfile';
import OSVResponse, { OSVQueryResult } from '../interfaces/osv_response_interface.js';
import { TimerOptions } from 'timers';
// Now you can access dependencies directly!
//This returns an array of key value pair, extracted from an object

const BATCH_SIZE = 25;
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

export async function extractDependenciesFromPnpmLock(packageLockJsonPath: Dirent[]): Promise<Dependency[]> {
    const allDependencies: Dependency[] = [];

    for (const dirent of packageLockJsonPath) {
        const dirPath = dirent.parentPath;
        const fullPath = path.join(dirPath, dirent.name);

        try {
            const fileContent = await fs.readFile(fullPath, 'utf8');
            // to convert it into object
            const lockfileJson = yaml.parse(fileContent);

            if (!lockfileJson || !lockfileJson.packages) {
                continue;
            }
            //entries is used to convert any object into array of arrays (key value pairs in one array)
            for (const [pkgKey, pkgData] of Object.entries<any>(lockfileJson.packages)) {
                //for older pnpm files
                //pnpm keys look like: "/express@4.19.2" or "/@babel/core@7.20.0(peer@1.0.0)"
                const cleanKey = pkgKey.startsWith('/') ? pkgKey.slice(1) : pkgKey;
                const lastAtIndex = cleanKey.lastIndexOf('@');

                if (lastAtIndex > 0) {
                    const packageName = cleanKey.substring(0, lastAtIndex);
                    let version = cleanKey.substring(lastAtIndex + 1);

                    // Remove peer dependency suffixes e.g., "1.3.8(cookie@0.6.0)" -> "1.3.8"
                    version = version.split('(')[0];

                    // pnpm lockfiles explicitly flag dev dependencies with `dev: true`
                    const isDev = pkgData.dev === true;

                    allDependencies.push({
                        packageName,
                        version,
                        isDev
                    });
                }
            }
        } catch (error: any) {
            logger.error({ error }, `Failed to process lockfile at ${fullPath}:`);
        }
    }

    return allDependencies;
}
export async function extractDependenciesFromYarnDirents(packageJsonPaths: Dirent[]): Promise<Dependency[]> {
    // Use a Map to prevent duplicates. Yarn often resolves different semver 
    // ranges to the exact same version, creating duplicate entries.
    const uniqueDeps = new Map<string, Dependency>();

    for (const dirent of packageJsonPaths) {
        // Node v20+ uses dirent.parentPath, older versions use dirent.path.
        const dirPath = dirent.parentPath
        const fullPath = path.join(dirPath, dirent.name);

        try {
            const fileContent = await fs.readFile(fullPath, 'utf8');

            // Note: If you are using Yarn Berry (v2+), the lockfile is pure YAML.
            // This parser specifically handles the classic Yarn v1 format.
            const parsed = yarnLockfile.parse(fileContent);

            if (parsed.type !== 'success') {
                logger.warn(`Could not parse yarn.lock format at ${fullPath}`);
                continue;
            }

            for (const [pkgKey, pkgData] of Object.entries<any>(parsed.object)) {
                // Yarn keys can be comma-separated: "lodash@^4.17.21, lodash@~4.17.21"
                // We just need the first one to extract the base name.
                const firstKey = pkgKey.split(',')[0].trim();

                // Find the last '@' to cleanly split scoped packages (e.g., "@babel/core@^7.0.0")
                const lastAtIndex = firstKey.lastIndexOf('@');

                if (lastAtIndex > 0) {
                    const packageName = firstKey.substring(0, lastAtIndex);
                    const version = pkgData.version; // The exact installed version

                    // OSV Key format: "express@4.19.2"
                    const dedupeKey = `${packageName}@${version}`;

                    if (!uniqueDeps.has(dedupeKey)) {
                        uniqueDeps.set(dedupeKey, {
                            packageName,
                            version,
                            isDev: false // Yarn lockfiles do not contain devDependency metadata
                        });
                    }
                }
            }
        } catch (error) {
            logger.error({ error }, `Failed to process lockfile at ${fullPath}:`);
        }
    }

    return Array.from(uniqueDeps.values());
}
async function OSVSecurityReport(dependencies: Dependency[]): Promise<{ findings: findings_interface[], securityScore: number | null, scanCompleted: boolean }> {
    //Dirent {
    //   name: 'cat.json',
    //   parentPath: '/Users/krishnasinghparmar/Desktop/test/folder1/folder2',
    //   path: '/Users/krishnasinghparmar/Desktop/test/folder1/folder2',
    //   [Symbol(type)]: 1

    let timer;
    let timeout2;
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
        let batchResponse: OSVResponse = {
            results: [],
        };
        const controller = new AbortController();

        timer = setTimeout(() => {
            controller.abort();
        }, 30000);

        try {
            const batchPromises = [];

            for (let i = 0; i < batchRequest.queries.length; i += BATCH_SIZE) {
                const batchQueries = {
                    queries: batchRequest.queries.slice(i, i + BATCH_SIZE),
                };

                batchPromises.push(
                    fetch("https://api.osv.dev/v1/querybatch", {
                        signal: controller.signal,
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(batchQueries),
                    })
                );
            }

            const responses = await Promise.all(batchPromises);

            for (const response of responses) {
                if (!response.ok) {
                    const errorText = await response.text();

                    const err = new Error(errorText);
                    err.name = "HTTPError";

                    throw err;
                }

                const data = (await response.json()) as OSVResponse;

                batchResponse.results.push(...data.results);
            }

        } catch (err) {
            logger.error({ err }, "Error while querying OSV batch endpoint");
            throw err;
        } finally {
            clearTimeout(timer);
        }
        //as is used for typecasting
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
        if ((batchResponse).results.length === 0) {
            logger.warn("No security issues found")
            return {
                findings: [],
                securityScore: 100,
                scanCompleted: true
            }
        }
        const advisoryIds = [
            ...new Set(
                (batchResponse).results.flatMap((result: any) =>
                    (result?.vulns ?? []).map((vuln: any) => vuln.id).filter(Boolean)
                )
            )
        ];
        const controller2 = new AbortController();

        timeout2 = setTimeout(() => {

            controller2.abort();

        }, 5000);

        const advisoryFindings: (findings_interface | null)[] = [];

        logger.info("Sending Request To OSV for each vulnerability")
        for (let i = 0; i < advisoryIds.length; i += BATCH_SIZE) {
            const batch = advisoryIds.slice(i, i + BATCH_SIZE);

            logger.info(
                `Processing advisory batch ${i / BATCH_SIZE + 1}`
            );

            const batchResults = await Promise.all(
                batch.map(async (advisoryId): Promise<findings_interface | null> => {
                    try {
                        const heavy = await fetch(
                            `https://api.osv.dev/v1/vulns/${advisoryId}`,
                            { signal: controller2.signal }
                        );

                        if (!heavy.ok) {
                            const errorText = await heavy.text();
                            logger.error(
                                `Failed to fetch advisory ${advisoryId}, error: ${errorText}`
                            );
                            return null;
                        }

                        logger.info(`Fetched advisory ${advisoryId}`);

                        const {
                            id,
                            summary,
                            database_specific
                        } = await heavy.json() as any;

                        let severity;

                        if (!database_specific?.severity) {
                            severity = "unknown";
                        } else if (database_specific.severity === "MODERATE") {
                            severity = "medium";
                        } else {
                            severity = database_specific.severity.toLowerCase();
                        }

                        return {
                            category: "security",
                            severity,
                            message: summary,
                            filePath: "",
                            rule: id,
                        };
                    } catch (err: any) {
                        logger.error(
                            { err },
                            `Error while fetching advisory ${advisoryId}`
                        );
                        return null;
                    }
                })
            );
            clearTimeout(timeout2)

            advisoryFindings.push(...batchResults);
        }

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
                securityScore: -1,
                scanCompleted: false
            }
        }

        return {
            findings: [],
            securityScore: -1,
            scanCompleted: false
        }

    }
    finally {

    }
}
export default OSVSecurityReport

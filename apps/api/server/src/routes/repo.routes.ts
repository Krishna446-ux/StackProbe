import { Request, Response, Router } from 'express'
import { makeRepoRecord, listAnalyzedRepos, repoHistory } from '../controller/repo.controller'
const router = Router()
router.post("/", makeRepoRecord);
router.get("/analyzed", listAnalyzedRepos);
router.get("/:repoId/history", repoHistory);
export default router;
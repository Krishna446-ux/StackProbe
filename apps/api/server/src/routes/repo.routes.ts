import { Request, Response, Router } from 'express'
import { makeRepoRecord } from '../controller/repo.controller'
const router = Router()

router.post("/", makeRepoRecord);
export default router;
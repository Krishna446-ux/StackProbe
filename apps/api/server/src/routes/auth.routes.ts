import { githubLogin, githubAccessToken, authenticateUser } from "../controller/auth.controller"
import { Router } from 'express';
const router = Router();
router.get("/github", githubLogin);
router.get("/github/callback", githubAccessToken)
router.get("/me", authenticateUser)
export default router;
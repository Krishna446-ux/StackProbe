import { githubLogin, githubAccessToken, authenticateUser, logoutUser } from "../controller/auth.controller"
import { Router } from 'express';
const router = Router();
router.get("/github", githubLogin);
router.get("/github/callback", githubAccessToken)
router.get("/me", authenticateUser)
router.post("/logout", logoutUser);
export default router;
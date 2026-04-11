import {githubLogin,githubAccessToken} from "../controller/auth.controller"
import {Router } from 'express';
const router = Router();
router.get("/github",githubLogin);
router.get("/github/callback",githubAccessToken)

export default router;
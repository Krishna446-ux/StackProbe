const express = require('express')
import { Request, Response, Router } from 'express'
import pinoHttp from "pino-http";
import "dotenv/config";
import cookieParser from 'cookie-parser';
import { healthDB, healthServer, pinoPretty } from './controller/health.controller'
import { jobDetails, reportDetails, getReportFindings, getJobCurrentStage } from './front_end_controllers/job_report_details'
import auth_routes from './routes/auth.routes'
import repo_routes from './routes/repo.routes'
import health_router from './routes/health.routes'
import { jwtAuthenticator } from './middlewares/authMiddlewares'

//FUTURE TODO: Needs to redirect the user towards the login page in case there jwt token expires
import 'dotenv/config'
import cors from 'cors'
import path from 'path';
const app = express()
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
const relativeDirname = "../../web/stackprobe_frontend";
const __dirname = path.resolve(process.cwd(), relativeDirname);
//console.log(process.cwd());

console.log(__dirname)
app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp(pinoPretty));
const port = 3000

// ═══════════════════════════════════════════════════════
// All backend endpoints live under /api to avoid
// collisions with React frontend routes.
// ═══════════════════════════════════════════════════════
const apiRouter = Router();

//HEALTH CHECK
apiRouter.use('/health', health_router)

//FRONT END APIS
apiRouter.get("/jobs/:id", jwtAuthenticator, jobDetails);
apiRouter.get("/reports/:id", jwtAuthenticator, reportDetails);
apiRouter.get("/reports/:reportId/findings", jwtAuthenticator, getReportFindings);
apiRouter.get("/job/currentStage/:jobId", jwtAuthenticator, getJobCurrentStage);

apiRouter.use("/auth", auth_routes)
//jwtAuthenticator is a middleware, whose job is to check each of these routes, and whenever, if they have came with a valid jwt token or not
apiRouter.use("/repos", jwtAuthenticator, repo_routes)

// Mount all API routes under /api prefix
app.use("/api", apiRouter);

// ═══════════════════════════════════════════════════════
// Static React assets + SPA catch-all (must be AFTER /api)
// ═══════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, "dist")));

//This is basically whole react app getting served right now
app.use((req: Request, res: Response) => {
    const file = path.join(__dirname, "dist", "index.html");

    console.log("SERVING:", file);

    res.sendFile(file);
});
console.log("__dirname =", __dirname);
console.log("static dir =", path.join(__dirname, "dist"));
console.log("index =", path.join(__dirname, "dist", "index.html"));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

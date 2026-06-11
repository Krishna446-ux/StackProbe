const express = require('express')
import { Request, Response } from 'express'
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
const app = express()
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp(pinoPretty));
const port = 3000

//HEALTH CHECK
app.use('/health', health_router)

//FRONT END APIS
app.get("/jobs/:id", jwtAuthenticator, jobDetails);
app.get("/reports/:id", jwtAuthenticator, reportDetails);
app.get("/reports/:reportId/findings", jwtAuthenticator, getReportFindings);
app.get("/job/currentStage/:jobId", jwtAuthenticator, getJobCurrentStage);
//FRONT END FINISH
app.get('/redis',);

app.use("/auth", auth_routes)
//jwtAuthenticator is a middleware, whose job is to check each of these routes, and whenever, if they have came with a valid jwt token or not
app.use("/repos", jwtAuthenticator, repo_routes)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

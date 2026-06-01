const express = require('express')
import { Request, Response } from 'express'
//import { pool } from "./db"
import pinoHttp from "pino-http";
import "dotenv/config";
import cookieParser from 'cookie-parser';
import { healthDB, health, jobDetails, pinoPretty } from './controller/health.controller'
import auth_routes from './routes/auth.routes'
import repo_routes from './routes/repo.routes'
import { jwtAuthenticator } from './middlewares/authMiddlewares'
import { redis } from "./redis"
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp(pinoPretty));
const port = 3000
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})
app.get('/health', health)
app.get('/db', healthDB);
app.get("/jobs/:id", jobDetails);
app.get('/redis', async (req: Request, res: Response) => {
    console.log("Checking Redis Connections")
    try {
        const reply = await redis.ping();
        res.json(reply);

    } catch (err: any) {
        console.error("REDIS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
app.use("/auth", auth_routes)
//jwtAuthenticator is a middleware, whose job is to check each of these routes, and whenever, if they have came with a valid jwt token or not
app.use("/repos", jwtAuthenticator, repo_routes)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

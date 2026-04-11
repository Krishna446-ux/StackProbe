const express = require('express')
import { Request, Response } from 'express'
import { pool } from "./db"
import pinoHttp from "pino-http";
import "dotenv/config";
import cookieParser from 'cookie-parser';
import auth_routes from './routes/auth.routes'
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp());
const port = 3000
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: "ok" })
})
app.get('/db', async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT 1");
        res.json({ status: "ok", data: result.rows });
    } catch (err: any) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/auth", auth_routes)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

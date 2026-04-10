const express = require('express')
import { Request, Response } from 'express'
import { pool } from "./db"
import pinoHttp from "pino-http";
import "dotenv/config";
import cookieParser from 'cookie-parser';
const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp());
const port = 3000
let crypto: any;
try {
    crypto = require('node:crypto');
} catch (err) {
    console.error('crypto support is disabled!');
}
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

app.get("/auth/github", (req: Request, res: Response) => {
    const state = crypto.randomBytes(16).toString('hex');
    //this the state for github o auth, basically used for preventing csrf attacks
    const url =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${process.env.GITHUB_CLIENT_ID}` +
        `&scope=read:user` +
        `&state=${state}`;
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000//5 minutes, we do not need this forever
    });
    res.redirect(url);
})
app.get("/auth/github/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;
    if (!state || state !== storedState) {
        return res.status(400).send("Invalid state");
    }
    //making a post request inside get handler
    const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID!,
                client_secret: process.env.GITHUB_CLIENT_SECRET!,
                code: code as string,
            }),
            //url search params convert my json to this client_id=abc&client_secret=xyz&code=123
        }
    );

    const data = await tokenRes.json();
    if (!data) {
        return res.status(400).send("Token Not Found");
    }

    const userRes = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${data.access_token}`,
        },
    });
    const user = await userRes.json();

    console.log(user.id);
    console.log(user.login);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

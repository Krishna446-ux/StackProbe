import { request } from "node:http";
import pool from "../db"
import { Request, Response } from 'express'
import { redis } from "../redis"
export const redisHealth = async (req: Request, res: Response) => {
    console.log("Checking Redis Connections")
    try {
        const reply = await redis.ping();
        res.json(reply);

    } catch (err: any) {
        console.error("REDIS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
}
export const healthDB = async (req: Request, res: Response) => {
    console.log("Checking DB Connections")
    try {
        const result = await pool.query("SELECT 1");
        res.json({ status: "ok", data: result.rows });
    } catch (err: any) {
        console.error("DB ERROR:", err);
        res.status(500).json({ error: err.message });
    }
}
export const health = (req: Request, res: Response) => {
    res.json({ status: "ok" })
}

export const pinoPretty = {
    // Only use pretty printing in development to save performance in production
    transport: process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,          // Adds color coding to status codes and levels
                translateTime: "SYS:standard", // Formats timestamp into readable format
                ignore: "pid,hostname",  // Hides clutter like process ID and host
                messageFormat: "\x1b[36m{req.method}\x1b[0m \x1b[35m{req.url}\x1b[0m - Status: {res.statusCode} ({res.time}ms)",

                customColors: "info:green,error:red,warn:yellow,debug:blue", // Force explicit colors per level
            },
        }
        : undefined, // Defaults to standard, ultra-fast JSON logging in production
}
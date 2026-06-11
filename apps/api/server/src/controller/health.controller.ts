import { request } from "node:http";
import logger from '../services/logger'
import pool from "../db"
import { Request, Response } from 'express'
import { redis } from "../redis"
import myQueue from "../queues/analysis.queue"
export const healthDB = async (req: Request, res: Response) => {
    logger.info("Checking DB Connections")
    try {
        const result = await pool.query("SELECT 1");
        res.json({ status: "ONLINE", data: result.rows });
    } catch (err: any) {
        logger.error({ err }, "DB ERROR:");
        res.status(500).json({ status: "OFFLINE" });
    }
}
export const healthServer = (req: Request, res: Response) => {
    res.json({ status: "ok" })
}
export const healthWorker = async (req: Request, res: Response) => {
    try {
        const workerHeartbeat = await redis.get("worker:heartbeat")
        //console.log(workerHeartbeat)
        if (!workerHeartbeat)
            return res.status(503).json({ "status": "OFFLINE" });

        return res.json({ "status": "ONLINE" });
    }
    catch (err: any) {
        logger.error(
            { err },
            "Failed to check worker heartbeat"
        );
        return res.status(503).json({
            "status": "Unknown"
        });
    }
}
export const healthRedis = async (req: Request, res: Response): Promise<void> => {
    try {
        const reply = await redis.ping();
        if (reply === 'PONG') {
            res.status(200).json({ status: 'ONLINE', });
            return;
        }

    } catch (err: any) {
        logger.error({ err }, "Redis health check failed")
        res.status(500).json({
            status: 'OFFLINE',
        });
    }
};

export const queueStats = async (req: Request, res: Response) => {
    res.json(await myQueue.getJobCounts());
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
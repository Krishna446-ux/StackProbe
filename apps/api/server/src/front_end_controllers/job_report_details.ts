import { Request, Response } from 'express'
import pool from "../db"
export const jobDetails = async (req: Request, res: Response) => {
    //get id from url params
    const { id } = req.params
    const { rows } = await pool.query('select * from jobs where job_id = $1', [id]);
    res.json(rows[0])

}
export const reportDetails = async (req: Request, res: Response) => {
    const { id } = req.params
    const { rows } = await pool.query('select * from reports where report_id = $1 ORDER BY created_at DESC LIMIT 1', [id]);
    res.json(rows[0])
}
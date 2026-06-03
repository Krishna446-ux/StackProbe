import { RepoInterface } from '../interfaces/repoInterface'
//import { JobInterface } from '../interfaces/jobInterface'
interface jobObject {
    "repo_id": string;
    "status": string;
}
import pool from '../db'
import { JobInterface } from '../interfaces/jobInterface';
//  'repo_id':{
//             type:'uuid',
//             primaryKey:true,
//             default:pgm.func("gen_random_uuid()")
//         },
//         'owner':{
//             type:'text',
//             notNull:true
//         },
//         'name':{
//             type:'text',
//             notNull:true
//         },
//         'created_at':{
//             default:pgm.func('now()'),
//             type:'timestamp'
//         }
// export interface RepoInterface{
//     "repo_id":'string';
//     "owner":'string';
//     "name":'string';
// };
export const createRepo = async (owner: string, name: string): Promise<RepoInterface> => {
    console.log(owner, name)
    const { rows } = await pool.query(
        `INSERT INTO repositories (owner, name)
     VALUES ($1, $2)
     ON CONFLICT (owner, name)
     DO UPDATE SET owner = EXCLUDED.owner
     RETURNING repo_id, owner, name`,
        [owner, name]
    );

    if (rows.length === 0) {
        console.log("Failed to insert or fetch repository");
    }

    return rows[0];
};
// export interface RepoInterface{
//     "repo_id":'string';
//     "owner":'string';
//     "name":'string';
// };

//export  interface jobInterface{
//     "job_id":'string';
//     "repo_id":'string';
//     "user_id":'string';
//     "status":'string';
//     "started":'date';
//     "completed_at":'date';
//     "faliure_reason":'string';
// };

//        export interface jwtPayload{
//     github_id: string;
//     user_id: string; inside req
// };

//     interface jobObject{
//     "repo_id":'string';
//     "user_id":'string';
//     "status":'string';
// }
// const job_columns={
//         "job_id":{
//             type:'uuid',
//             primaryKey:true,
//             default:pgm.func('gen_random_uuid()'),
//         },
//         "repo_id":{
//             type:'uuid',
//             notNull:true,

//         },
//         "user_id":{
//             type:'uuid',
//             notNull:true,

//         },

//         'status':{
//             type:'text',
//             notNull:true
//         }
//         ,
//         'started_at':{
//             type:'timestamp'
//         },
//         'completed_at':{
//             type:'timestamp'
//         },
//         'failure_reason':'text'

//     }
export const createJob = async (jobDetails: jobObject): Promise<JobInterface> => {
    const { rows } = await pool.query(
        `INSERT INTO jobs (repo_id,status)
     VALUES ($1, $2)
     RETURNING *`,
        [jobDetails.repo_id, "PENDING"])
    if (rows.length === 0) {

        throw new Error("Failed to insert repository");
    }
    return rows[0] as JobInterface;
}
export const activeJob = async (repo_id: string): Promise<any> => {
    const { rows } = await pool.query(
        `SELECT * FROM jobs
         WHERE repo_id=$1 
         AND status IN ('PENDING','RUNNING')
        `,
        [repo_id])
    if (rows.length > 0) return {
        success: true,
        job: rows[0]
    };
    else return {
        success: false,
    }

}
export const completedJob = async (repo_id: string): Promise<any> => {
    const { rows } = await pool.query(
        `SELECT * FROM jobs
         WHERE repo_id=$1 
         AND status IN ('COMPLETE')
         ORDER BY completed_at DESC
         LIMIT 1
        `,
        [repo_id])
    if (rows.length > 0) return {
        success: true,
        job: rows[0],
    };
    else return {
        success: false,
    }
}
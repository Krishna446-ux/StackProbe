import pool from "../lib/db"
import logger from "../lib/logger"
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
export const setJobStatus = async (job_id: string, status: string, faliure_reason: string) => {
    //failure_reason
    try {
        if (status === "RUNNING") {
            const { rows } = await pool.query(
                `UPDATE jobs
         SET status = $2,
         started_at=now()
         WHERE job_id = $1
         RETURNING *`,
                [job_id, status]
            );
            if (rows.length === 0)
                logger.error("Job status did not got updated to running")
            return rows[0];
        }
        else if (status === "COMPLETE") {
            const { rows } = await pool.query(
                `UPDATE jobs
         SET status = $2,
        completed_at=now()
         WHERE job_id = $1
         RETURNING *`,
                [job_id, status]
            );
            if (rows.length === 0)
                logger.error("Job status did not got updated to completed")
            return rows[0];
        }
        else {
            const { rows } = await pool.query(
                `UPDATE jobs
         SET status = $2,
         failure_reason=$3
         WHERE job_id = $1
         RETURNING *`,
                [job_id, status, faliure_reason]
            );
            if (rows.length === 0)
                logger.error("Job status did not got updated to falied")
            return rows[0];
        }
    }
    catch (err: any) {
        logger.error("Error in setting job status", err);
        console.log(err);
    }
};
/*
This is how the insides of row[0] looks like
{
//metadata over here 
  "command": "UPDATE",
  "rowCount": 1,
  "oid": null,
  "fields": [ ... ], 
  "rows": [
    {
      "job_id": "9876",
      "status": "completed",
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-06-01T20:55:00Z"
    }
  ]
}
 */
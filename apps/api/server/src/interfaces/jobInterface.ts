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
export  interface JobInterface{
    "job_id":'string';
    "repo_id":'string';
    "user_id":'string';
    "status":'string';
    "started_at":'date';
    "completed_at":'date';
    "faliure_reason":'string';

};

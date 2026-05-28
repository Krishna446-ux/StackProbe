/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
    const options={
        ifNotExists:true,
    }
    const users_columns={
        "user_id":{
            type:'uuid',
            primaryKey:true,
            default:pgm.func('gen_random_uuid()'),
        },
        "github_id":{
            notNull:true,
            unique:true,
            type:'text'},
        "access_token":{
            notNull:true,
            type:'text'
        },
        "created_at":{
            default:pgm.func('now()'),
            type:'timestamp'
        }
    }
    const repo_columns={
        'repo_id':{
            type:'uuid',
            primaryKey:true,
            default:pgm.func("gen_random_uuid()")
        },
        'owner':{
            type:'text',
            notNull:true
        },
        'name':{
            type:'text',
            notNull:true
        },
        'created_at':{
            default:pgm.func('now()'),
            type:'timestamp'
        }
    }
    const job_columns={
        "job_id":{
            type:'uuid',
            primaryKey:true,
            default:pgm.func('gen_random_uuid()'),
        },
        "repo_id":{
            type:'uuid',
            notNull:true,
            
        },
        "user_id":{
            type:'uuid',
            notNull:true,
            
        },

        'status':{
            type:'text',
            notNull:true
        }
        ,
        'started_at':{
            type:'timestamp'
        },
        'completed_at':{
            type:'timestamp'
        },
        'failure_reason':'text'
        
    }
    pgm.createTable("users", users_columns, options )
    pgm.createTable("repositories", repo_columns, options )
    pgm.addConstraint("repositories",'uniqueOwner_Name','UNIQUE (owner, name)')
    
    pgm.createTable("jobs", job_columns, options )
    pgm.addConstraint("jobs",'jobs_foreign_user_id',{
        foreignKeys:{
            columns:['user_id'],
            references:'users(user_id)',
            onDelete:'CASCADE',
            onUpdate:'CASCADE',
        }
    })
    pgm.addConstraint("jobs",'jobs_foreign_repo_id',{
        foreignKeys:{
            columns:'repo_id',
            references:'repositories(repo_id)',
            onDelete:'CASCADE',
            onUpdate:'CASCADE',
        }
    })
    const report_columns={
        "report_id":{
            type:'uuid',
            primaryKey:true,
            default:pgm.func('gen_random_uuid()'),
        },
        'job_id':{
            type:'uuid',
            notNull:true,
        },
        "quality_score":{
            type:'integer',
            notNull:true,
            
        },
        "security_score":{
            type:'integer',
            notNull:true,
        },
        'ai_summary':{
            type:'text',
        }
        ,
        'created_at':{
            type:'timestamp',
            default:pgm.func("now()")
        },
    }
    pgm.createTable("reports", report_columns, options )
    pgm.addConstraint("reports","reports_foreign_key",{
        foreignKeys:{
            columns:['job_id'],
            references:'jobs(job_id)'
        }
    })
    const findings_columns={
        "finding_id":{
            type:'uuid',
            primaryKey:true,
            default:pgm.func('gen_random_uuid()'),
        },
        'report_id':{
            type:'uuid',
            notNull:true,
        },
        "category":{
            type:'text',
            notNull:true,
            
        },
        "severity":{
            type:'text',
            notNull:true,
            
        },
        "message":{
            type:'text',
            notNull:true,
        },
        'created_at':{
            default:pgm.func("now()"),
            type:'timestamp'
        },
    }
    pgm.createTable("findings", findings_columns, options )
    pgm.addConstraint("findings","findings_foreign_key",{
        foreignKeys:{
            columns:['report_id'],
            references:'reports(report_id)'
        }
    })

};

/**
 * 
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
*/
exports.down = (pgm) => {
    const options={
        ifExists:true,
    }
    pgm.dropTable( 'findings', options )
    pgm.dropTable( 'reports', options )
    pgm.dropTable( 'jobs', options )
    pgm.dropTable( 'repositories', options )
    pgm.dropTable( 'users', options )
};

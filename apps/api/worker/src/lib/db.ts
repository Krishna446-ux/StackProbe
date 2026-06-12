import { Pool, ClientBase } from 'pg'
import 'dotenv/config'
const onConnect = async (client: ClientBase): Promise<void> => {
    try {
        await client.query('SELECT 1');
        console.log("Postgres connected");
    }
    catch (e) {
        console.log("Failed to connect");
    }
}

const pool = process.env.DATABASE_URL

    ? new Pool({

        connectionString: process.env.DATABASE_URL,

        ssl: {

            rejectUnauthorized: false,

        },

        max: 10,

        idleTimeoutMillis: 20000,

        connectionTimeoutMillis: 10000,

        maxLifetimeSeconds: 60,

        allowExitOnIdle: true,

        min: 3,

    })

    : new Pool({

        user: process.env.DB_USER,

        password: process.env.DB_PASSWORD,

        host: process.env.DB_HOST,

        port: parseInt(process.env.DB_PORT || "5432"),

        database: process.env.DB_NAME,

        max: 10,

        idleTimeoutMillis: 20000,

        connectionTimeoutMillis: 10000,

        maxLifetimeSeconds: 60,

        allowExitOnIdle: true,

        min: 3,

    });
export default pool;
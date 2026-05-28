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

export const pool = new Pool({
    //connectionString: process.env.DATABASE_URL,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postGres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "stackprobe",

    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    maxLifetimeSeconds: 60,
    min: 3,
    onConnect: onConnect
})
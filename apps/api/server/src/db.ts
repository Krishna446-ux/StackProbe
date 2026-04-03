import { Pool,ClientBase } from 'pg'
import 'dotenv/config'
const onConnect=async(client:ClientBase):Promise<void>=>{
    try{
        await client.query('SELECT 1');
        console.log("Postgres connected");
    }
    catch(e){
        console.log("Failed to connect");
    }
}
export const pool = new Pool({
    max: 10,
    idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 2000,
  maxLifetimeSeconds: 60,
  allowExitOnIdle: true,
   min: 3,
   onConnect:onConnect
})

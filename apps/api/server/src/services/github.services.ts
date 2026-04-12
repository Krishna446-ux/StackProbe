import { pool } from "../db"
interface GithubUser {
  github_id: string;
  access_token: string;
}
export const tokenFetch = async (code: string): Promise<string> => {
    const tokenPromise = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
            credentials: 'include', 
            body: new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID!,
                client_secret: process.env.GITHUB_CLIENT_SECRET!,
                code: code as string,
            }),
            //url search params convert my json to this client_id=abc&client_secret=xyz&code=123
        })
        const data = await tokenPromise.json();
        
    //data is basically this json object
    // data={
    //     access_token:string,
    //     token_type:string,
    //     scope,
    // }
    return data.access_token;
};
export const userRes = async (access_token: string): Promise<GithubUser> => {
    const userD = await fetch("https://api.github.com/user", {
        method: "GET",
        credentials: 'include', 
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${access_token}`,
        },
    })
    const user = await userD.json();
    console.log(user);
    return {
        github_id:user.id,
        access_token:access_token};
    }
    export const userRecord = async (userDetails: GithubUser):Promise<any>=> {
        
    console.log("Database access started");
    
    const result = await pool.query(
        `INSERT INTO users (github_id, access_token)
        VALUES ($1, $2)
        ON CONFLICT (github_id)
        DO UPDATE SET access_token = EXCLUDED.access_token
        RETURNING user_id, github_id`,
        [userDetails.github_id, userDetails.access_token]
    );
    console.log("Database access ended");

  return result.rows[0];
};

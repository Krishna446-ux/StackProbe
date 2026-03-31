
const express = require('express')
const port = 3000
const app = express()
import { repoDetail, repoResponse } from "./interfaces/interface"
import {Request,Response} from 'express'
//specifically built request reponse type inside express for typescript
const simpleGit = require('simple-git');
const git=simpleGit()
app.use(express.json());
simpleGit().clean(simpleGit.CleanOptions.FORCE);
//import { Octokit } from "octokit";
//, ["/workerFiles", []]

app.get('/', (req:Request, res:Response) => {
    res.send('Hello World!')
})

app.post("/probeReq", async(req: Request, res: Response) => {
    const makeClone = async (): Promise<repoResponse> => {
        try {
            console.log(req.body.repoUrl);
            const p=await git.clone(req.body.repoUrl,`workerFiles/${Date.now()}`);
            return {
                success: 1,
            };
        }
        catch (e) {
            console.log("Failed To clone The Repo ");
            
            return {
                success: 0,
            };
        }
    }
    const a=await makeClone();
    res.send(a);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

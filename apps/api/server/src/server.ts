const express = require('express')
import {Request,Response} from 'express'
import {pool} from "./db"
import pinoHttp from "pino-http";
import "dotenv/config";
const app = express()
app.use(express.json())
app.use(pinoHttp());
const port = 3000

app.get('/', (req:Request, res:Response) => {
  res.send('Hello World!')
})
app.get('/health',(req:Request,res:Response)=>{
    res.json({status:"ok"})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

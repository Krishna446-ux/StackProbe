import { Request, Response } from 'express';
import { tokenFetch,userRes,userRecord} from '../services/github.services';
var jwt=require('jsonwebtoken')
import "dotenv/config";
let crypto: any;
try {
    crypto = require('node:crypto');
} catch (err) {
    console.error('crypto support is disabled!');
}
export const githubLogin= (req: Request, res: Response) => {
    const state = crypto.randomBytes(16).toString('hex');
    //this the state for github o auth, basically used for preventing csrf attacks
    const url =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${process.env.GITHUB_CLIENT_ID}` +
        `&scope=read:user` +
        `&state=${state}`;
    //cookies
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 1000//5 minutes, we do not need this forever
    });
    res.redirect(url);
}
export const githubAccessToken= async (req: Request, res: Response) => {
        
        const { code, state } = req.query;
        const storedState = req.cookies.oauth_state;
        //state validation part of controller
        if (!state || state !== storedState) {
            return res.status(400).send("Invalid state");
        }
        if(!code ||typeof code !=="string")return res.status(400).send("Invalid Code");
        const access_token = await tokenFetch(code);
        if (!access_token||typeof access_token!=="string") {
            return res.status(400).send("Token Not Found");
        }
        const userDetails=await userRes(access_token);
        const userObj={
            github_id: userDetails.github_id,
            access_token: userDetails.access_token
        }
        const user=await userRecord(userObj);
        console.log(user);
        const payload={
            github_id:user.github_id,
            user_id:user.user_id
        }
        //jwt.sign(payload, secretOrPrivateKey, [options, callback])
        const jwtOptions={ 
            expiresIn:"7d"
        };
        const jwtToken=jwt.sign(payload, process.env.JWT_SECRET_KEY,jwtOptions);
        //res.cookie(name, value [, options])
        res.cookie("jwtAuth",jwtToken,{
            "expires":new Date(Date.now()+ 60 *60 *24 * 7*1000),
            "httpOnly":true,
            "secure":process.env.NODE_ENV === "production",
            "sameSite": "lax"
        })
        res.send("Cookies set succesfully")
    };
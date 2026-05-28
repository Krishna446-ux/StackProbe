import jwt from "jsonwebtoken";
import {Request,Response,NextFunction} from 'express'
import "dotenv/config";
import {jwtPayload} from '../interfaces/jwtPayload'
export const jwtAuthenticator=(req:Request,res:Response,next:NextFunction)=>{
    const jsonWebToken=req.cookies.jwtAuth;
    if(!jsonWebToken){
        return res.status(401).json({ error: "No token provided" });
    }
    //jwt.verify(token, secretOrPublicKey, [options, callback])
    const jwtOptions={
        complete:true,
        //complete: return an object with the decoded { payload, header, signature } instead of only the usual content of the payload.
    }
    try{
        const payload=jwt.verify(jsonWebToken,process.env.JWT_SECRET_KEY!) as jwtPayload;
        
        //err1 expiry date of the token
        //err2 signature not matching
        (req as any).user = payload;
        
        next();
    }
    catch(err:any){
        console.log("JWT Error:", err);
        return res.status(401).json({ error: "Invalid or expired token" });
        //so in any case like this redirect back to login
        //that has to be handled in the frontend
    }   
}
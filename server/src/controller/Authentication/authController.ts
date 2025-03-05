import { NextFunction, Request, Response } from "express";
import { prisma } from "../../util/prisma";
import bcrypt from 'bcrypt';
import httpError from "../../util/httpError";
import responseMessage from "../../constant/responseMessage";
import httpResponse from "../../util/httpResponse";
import quicker from "../../util/quicker";
import { LoginRequest } from "./types";
import config from "../../config/config";

export default {
    
    register: async (req: Request, res: Response, next: NextFunction) => {
        
        try {
            const { email, password } = req.body;
            
            const userExist = await prisma.user.findFirst({
                where: {
                    email: email
                }
            })

            if(userExist) {
                return httpError(next, new Error("User already exists."), req, 400);
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    email: email,
                    password: hashedPassword
                }
            })

            httpResponse(req, res, 200, responseMessage.SUCCESS)

        } catch (error) {
            console.error("Error while registering user.", error);
            httpError(next, error, req, 500)
        }
    },

    login: async(req: LoginRequest, res: Response, next: NextFunction) => {

        try {
            console.log(req.user);
            
            if(!req.user?.userId) {
                throw new Error("User not found.")
            }
            const accessToken = quicker.generateToken(
                {
                    userId: req.user.userId
                },
                config.ACCESS_TOKEN.SECRET as string,
                config.ACCESS_TOKEN.EXPIRY
            )

            httpResponse(req, res, 200, responseMessage.SUCCESS, {
                accessToken
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
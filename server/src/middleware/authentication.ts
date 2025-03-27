import { NextFunction, Request, Response } from 'express'
import quicker from '../util/quicker'
import config from '../config/config'
import httpError from '../util/httpError'
import responseMessage from '../constant/responseMessage'
import { DecryptedJwt } from '../controller/Authentication/types'

export default async (req: Request, _res: Response, next: NextFunction) => {
    try {
        let accessToken: string | undefined

        if (!accessToken) {
            const authHeader = req.headers.authorization
            if (authHeader?.startsWith('Bearer ')) {
                accessToken = authHeader.substring(7)
            }
        }

        if (!accessToken) {
            return httpError(next, new Error(responseMessage.UNAUTHORIZED), req, 401)
        }

        const { userId } = quicker.verifyToken(accessToken, config.ACCESS_TOKEN.SECRET as string) as DecryptedJwt

        if(!userId) {
            return httpError(next, new Error(responseMessage.UNAUTHORIZED), req, 401)

        }
        const user = {
            userId
        }
        
        req.user = user
        return next()

    } catch (err) {
        httpError(next, err, req, 500)
    }
}
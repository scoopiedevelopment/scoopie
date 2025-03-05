import { Request } from "express"
import { JwtPayload } from "jsonwebtoken"

export interface RegisterRequestBody {
    emailAddress: string,
    password: string
}

export interface RegisterRequest extends Request {
    body: RegisterRequestBody
}

export interface LoginRequest extends Request {
    user: {
        userId: string,
    }
}

export interface DecryptedJwt extends JwtPayload {
    userId: string
}

export interface User {
    userId: string
}

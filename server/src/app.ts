import express, { Application, NextFunction, Request, Response } from 'express'
import router from './router/apiRouter'
import './config/passport'
import globalErrorHandler from './middleware/globalErrorHandler'
import responseMessage from './constant/responseMessage'
import httpError from './util/httpError'
import helmet from 'helmet'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'

const app: Application = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(
    session({
        secret: 'check',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    })
)
app.use(passport.initialize())
app.use(passport.session())
app.use('/api/v1', router)

app.use((req: Request, _: Response, next: NextFunction) => {
    try {
        throw new Error(responseMessage.NOT_FOUND('route'))
    } catch (err) {
        httpError(next, err, req, 404)
    }
})

app.use(globalErrorHandler)

export default app
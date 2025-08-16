import { Request } from 'express'
import { THttpError } from '../types/types'
import responseMessage from '../constant/responseMessage'
import config from '../config/config'
import { EApplicationEnvironment } from '../constant/application'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export default (
  err: unknown,
  req: Request,
  errorStatusCode: number = 500
): THttpError => {
  let message: string = responseMessage.SOMETHING_WENT_WRONG

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        message = 'Duplicate entry. A record with this value already exists.'
        errorStatusCode = 409
        break
      case 'P2003':
        message = 'Foreign key constraint failed.'
        errorStatusCode = 400
        break
      case 'P2025':
        message = 'Record not found.'
        errorStatusCode = 404
        break
      default:
        message = `Database error: ${err.message}`
    }
  } else if (err instanceof Error) {
    // Normal JS/TS error
    message = err.message || responseMessage.SOMETHING_WENT_WRONG
  }

  const errorObj: THttpError = {
    success: false,
    statusCode: errorStatusCode,
    request: {
      ip: req.ip || null,
      method: req.method,
      url: req.originalUrl,
    },
    message,
    data: null,
    trace: err instanceof Error ? { error: err.stack } : null,
  }

  // Hide sensitive info in production
  if (config.ENV === EApplicationEnvironment.PRODUCTION) {
    delete errorObj.request.ip
    delete errorObj.trace
  }

  return errorObj
}

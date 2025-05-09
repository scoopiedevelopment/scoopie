import { NextFunction, Request } from 'express'
import errorObject from './errorObject'
import { Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export default (nextFunc: NextFunction, err: Error | unknown, req: Request, errorStatusCode: number = 500): void => {

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2023':
                return nextFunc(errorObject(new Error('Invalid Id provided.'), req, 409));

            case 'P2002':
                return nextFunc(errorObject(new Error('Username is already taken. Please choose another one.'), req, 409));

            case 'P2025':
                return nextFunc(errorObject(new Error(`${String(err.meta?.modelName)} data not found.`), req, 404));

            case 'P2003':
                return nextFunc(errorObject(new Error('Invalid reference to another record.'), req, 400));

            default:
                return nextFunc(errorObject(new Error('Database error. Please try again later.'), req, 500));
        }
    }
    return nextFunc(errorObject(err, req, errorStatusCode));
}
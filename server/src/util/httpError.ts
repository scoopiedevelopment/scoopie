import { NextFunction, Request } from 'express';
import errorObject from './errorObject';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export default (
  nextFunc: NextFunction,
  err: unknown,
  req: Request,
  errorStatusCode: number = 500
): void => {
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2023':
        return nextFunc(errorObject(new Error('Invalid Id provided.'), req, 409));

      case 'P2002': {
        const target = (err.meta?.target as string[]) || [];

        let message = 'Duplicate entry.';

        if (target.includes('username')) {
          message = 'Username is already taken. Please choose another one.';
        } else if (target.includes('userId_postId')) {
          message = 'This post is already saved.';
        } else if (target.includes('userId_clipId')) {
          message = 'This clip is already saved.';
        }

        return nextFunc(errorObject(new Error(message), req, 409));
      }

      case 'P2025':
        return nextFunc(
          errorObject(new Error(`${String(err.meta?.modelName)} data not found.`), req, 404)
        );

      case 'P2003':
        return nextFunc(
          errorObject(new Error('Invalid reference to another record.'), req, 400)
        );

      default:
        return nextFunc(
          errorObject(new Error('Database error. Please try again later.'), req, 500)
        );
    }
  }

  // fallback for all non-Prisma errors
  const error =
    err instanceof Error
      ? err
      : new Error(typeof err === 'string' ? err : 'Unknown error occurred');

  return nextFunc(errorObject(error, req, errorStatusCode));
};

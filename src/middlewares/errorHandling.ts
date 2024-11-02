import { NextFunction, Request, Response } from 'express';

type ErrorAPI = Error & {
    statusCode?: number;
};

const errorHandlingMiddleware = (
    e: ErrorAPI,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    res.status(e?.statusCode ? e.statusCode : 500).send(e);
    next();
};

export default errorHandlingMiddleware;

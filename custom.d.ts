declare namespace Express {
    export interface Request {
        traceId?: string;
    }
}

declare namespace NodeJS {
    export interface ProcessEnv {
        BASIC_AUTH_LOGIN: string;
        BASIC_AUTH_PASSWORD: string;
    }
}

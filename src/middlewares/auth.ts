import basicAuth from 'express-basic-auth';

export const authMiddleware = () =>
    basicAuth({
        users: {
            [process.env.BASIC_AUTH_LOGIN as string]: process.env
                .BASIC_AUTH_PASSWORD as string,
        },
        unauthorizedResponse: () => {
            throw {
                message: "You aren't authorized",
                statusCode: 401,
            };
        },
    });

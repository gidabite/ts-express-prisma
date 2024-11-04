import basicAuth from 'express-basic-auth';

const authMiddleware = () =>
    basicAuth({
        users: {
            [process.env.BASIC_AUTH_LOGIN]: process.env.BASIC_AUTH_PASSWORD,
        },
        unauthorizedResponse: () => {
            throw {
                message: "You aren't authorized",
                statusCode: 401,
            };
        },
    });

export default authMiddleware;

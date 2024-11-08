import basicAuth from 'express-basic-auth';

export const invalidAuthAnswer = {
    message: "You aren't authorized",
    statusCode: 401,
};

const authMiddleware = () =>
    basicAuth({
        users: {
            [process.env.BASIC_AUTH_LOGIN]: process.env.BASIC_AUTH_PASSWORD,
        },
        unauthorizedResponse: () => {
            throw invalidAuthAnswer;
        },
    });

export default authMiddleware;

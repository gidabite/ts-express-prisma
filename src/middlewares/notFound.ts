const notFoundMiddleware = () => {
    throw {
        statusCode: 404,
        message: 'A resource is not found',
    };
};

export default notFoundMiddleware;

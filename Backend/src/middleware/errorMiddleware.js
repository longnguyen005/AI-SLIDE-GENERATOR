import { ApiError } from '../utils/ApiError.js';
export const errorMiddleware = (error, _req, res, _next) => {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    res.status(statusCode).json({
        message: error.message || 'Internal server error'
    });
};

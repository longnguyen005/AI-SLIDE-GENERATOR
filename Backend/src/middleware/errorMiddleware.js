import { ApiError } from '../utils/ApiError.js';

export const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof ApiError) {
        if (error.statusCode >= 500) {
            if (process.env.NODE_ENV !== 'test') {
                console.error('[Error]', error);
            }
            return res.status(error.statusCode).json({ message: 'Internal server error' });
        }
        return res.status(error.statusCode).json({ message: error.message });
    }

    if (error?.name === 'CastError') {
        return res.status(400).json({
            message: `Invalid ${error.path || 'identifier'}`
        });
    }

    if (error?.name === 'ValidationError') {
        const details = Object.values(error.errors || {})
            .map((item) => item.message)
            .filter(Boolean)
            .join(', ');
        return res.status(400).json({
            message: details || error.message || 'Validation failed'
        });
    }

    if (error?.type === 'entity.parse.failed' || (error instanceof SyntaxError && 'body' in error)) {
        return res.status(400).json({ message: 'Invalid JSON request body' });
    }

    if (typeof error?.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
        return res.status(error.statusCode).json({
            message: error.message || 'Request failed'
        });
    }

    if (process.env.NODE_ENV !== 'test') {
        console.error('[Error]', error);
    }

    return res.status(500).json({
        message: 'Internal server error'
    });
};

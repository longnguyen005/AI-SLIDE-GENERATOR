import { ApiError } from '../utils/ApiError.js';
export function validateBody(validator) {
    return (req, _res, next) => {
        const message = validator(req.body);
        if (message)
            throw new ApiError(400, message);
        next();
    };
}

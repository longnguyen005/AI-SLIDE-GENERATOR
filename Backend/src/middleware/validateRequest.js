import { ApiError } from '../utils/ApiError.js';

export function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body ?? {});
        if (!parsed.success) {
            const firstIssue = parsed.error.issues?.[0];
            const pathPrefix = firstIssue?.path?.length ? `${firstIssue.path.join('.')}: ` : '';
            const message = firstIssue ? `${pathPrefix}${firstIssue.message}` : 'Invalid request body';
            throw new ApiError(400, message);
        }
        req.body = parsed.data;
        next();
    };
}

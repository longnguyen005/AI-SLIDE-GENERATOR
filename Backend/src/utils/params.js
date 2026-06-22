import { ApiError } from './ApiError.js';
export function routeParam(value, name) {
    if (!value || Array.isArray(value))
        throw new ApiError(400, `${name} is required`);
    return value;
}

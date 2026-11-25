import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

export function routeParamObjectId(value, name = 'id') {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (
        !normalized ||
        Array.isArray(value) ||
        !mongoose.isValidObjectId(normalized) ||
        !/^[0-9a-fA-F]{24}$/.test(normalized)
    ) {
        throw new ApiError(400, `Invalid ${name}`);
    }
    return normalized;
}

export const routeParam = routeParamObjectId;

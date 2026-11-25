import dotenv from 'dotenv';

dotenv.config();

function splitCsv(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function loadEnv(rawEnv = process.env) {
    const nodeEnv = rawEnv.NODE_ENV || 'development';
    const rawJwtSecret = rawEnv.JWT_SECRET?.trim();

    if (nodeEnv === 'production' && (!rawJwtSecret || rawJwtSecret === 'dev-secret-change-me')) {
        throw new Error('JWT_SECRET must be set to a strong non-default secret in production');
    }

    const corsOrigins = splitCsv(rawEnv.CORS_ORIGINS || rawEnv.CORS_ORIGIN || 'http://localhost:5173');

    return {
        nodeEnv,
        port: Number(rawEnv.PORT || 5000),
        mongoUri: rawEnv.MONGODB_URI || 'mongodb://localhost:27017/deckai',
        jwtSecret: rawJwtSecret || 'dev-secret-change-me',
        corsOrigin: corsOrigins[0] || 'http://localhost:5173',
        corsOrigins,
        geminiApiKeys: splitCsv(rawEnv.GEMINI_API_KEYS || rawEnv.GEMINI_API_KEY || ''),
        geminiModels: splitCsv(
            rawEnv.GEMINI_MODELS || 'gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash-lite'
        ),
        dnsServers: splitCsv(rawEnv.DNS_SERVERS || '')
    };
}

export const env = loadEnv(process.env);

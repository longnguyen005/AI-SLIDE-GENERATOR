import dotenv from 'dotenv';
dotenv.config();
export const env = {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/deckai',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    geminiApiKeys: (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
    geminiModels: (process.env.GEMINI_MODELS || 'gemini-2.0-flash,gemini-2.0-flash-lite,gemini-2.5-flash-lite')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    dnsServers: (process.env.DNS_SERVERS || '')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean)
};

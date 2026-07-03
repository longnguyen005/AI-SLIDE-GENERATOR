import dotenv from 'dotenv';
dotenv.config();
export const env = {
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/deckai',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    dnsServers: (process.env.DNS_SERVERS || '')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean)
};

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import deckRoutes from './routes/deck.routes.js';
import slideRoutes from './routes/slide.routes.js';

const DB_READY_STATES = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later.' }
});

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI generation rate limit reached, please wait before trying again.' }
});

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(
    cors({
        origin(requestOrigin, callback) {
            if (!requestOrigin || env.corsOrigins.includes('*') || env.corsOrigins.includes(requestOrigin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        exposedHeaders: ['Content-Disposition']
    })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
    const db = DB_READY_STATES[mongoose.connection.readyState] || 'disconnected';
    res.json({ status: 'ok', db });
});

app.use('/api', apiLimiter);
app.use(['/api/auth/register', '/api/auth/login', '/api/auth/demo'], authLimiter);
app.use(
    [
        '/api/decks/:deckId/outline/generate',
        '/api/decks/:deckId/slides/generate',
        '/api/slides/:slideId/regenerate'
    ],
    aiLimiter
);

app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/slides', slideRoutes);

app.use(errorMiddleware);

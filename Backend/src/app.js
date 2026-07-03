import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import deckRoutes from './routes/deck.routes.js';
import slideRoutes from './routes/slide.routes.js';
export const app = express();
app.use(cors({ origin: env.corsOrigin, credentials: true, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/slides', slideRoutes);
app.use(errorMiddleware);

import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

export const server = app.listen(env.port, () => {
    console.log(`DeckAI API running on http://localhost:${env.port}`);
});

connectDb().catch((error) => {
    console.error('MongoDB initial connection failed:', error.message || error);
});

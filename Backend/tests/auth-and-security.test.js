import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import * as envModule from '../src/config/env.js';
import { errorMiddleware } from '../src/middleware/errorMiddleware.js';
import { SlideVersion } from '../src/models/SlideVersion.model.js';
import * as paramsModule from '../src/utils/params.js';

function getMongoMemoryOptions() {
    if (process.env.MONGOMS_SYSTEM_BINARY) {
        return { binary: { systemBinary: process.env.MONGOMS_SYSTEM_BINARY } };
    }
    if (process.platform === 'win32') {
        const baseDir = 'C:\\Program Files\\MongoDB\\Server';
        if (fs.existsSync(baseDir)) {
            const versions = fs.readdirSync(baseDir).sort().reverse();
            for (const ver of versions) {
                const candidate = path.join(baseDir, ver, 'bin', 'mongod.exe');
                if (fs.existsSync(candidate)) {
                    const out = execFileSync(candidate, ['--version'], { encoding: 'utf8' });
                    const detectedVersion = out.match(/db version v(\d+\.\d+\.\d+)/)?.[1];
                    return {
                        binary: {
                            systemBinary: candidate,
                            ...(detectedVersion ? { version: detectedVersion } : {})
                        }
                    };
                }
            }
        }
    }
    return {};
}

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create(getMongoMemoryOptions());
    await mongoose.connect(mongoServer.getUri());
}, 30000);

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});

async function registerUser(overrides = {}) {
    const payload = {
        fullName: overrides.fullName || 'Test User',
        email: overrides.email || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
        password: overrides.password || 'StrongPass123!'
    };
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    return res.body;
}

describe('Task 1: Backend Resilience, Security, Zod Validation & Demo Auth', () => {
    it('GET /api/health returns 200 with status ok, db connected, and Helmet headers', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            status: 'ok',
            db: 'connected'
        });
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('production env guard rejects missing or default JWT_SECRET and parses corsOrigins', () => {
        expect(typeof envModule.loadEnv).toBe('function');

        expect(() => envModule.loadEnv({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/i);
        expect(() =>
            envModule.loadEnv({
                NODE_ENV: 'production',
                JWT_SECRET: 'dev-secret-change-me'
            })
        ).toThrow(/JWT_SECRET/i);

        const validProdEnv = envModule.loadEnv({
            NODE_ENV: 'production',
            JWT_SECRET: 'super-secure-production-jwt-secret-key',
            CORS_ORIGIN: 'https://deckai.vercel.app, http://localhost:5173'
        });
        expect(validProdEnv.jwtSecret).toBe('super-secure-production-jwt-secret-key');
        expect(validProdEnv.corsOrigins).toEqual(['https://deckai.vercel.app', 'http://localhost:5173']);
    });

    it('rejects invalid email and >72-char password on POST /api/auth/register and invalid login body with 400', async () => {
        const badEmail = await request(app).post('/api/auth/register').send({
            fullName: 'Invalid Email User',
            email: 'not-an-email',
            password: 'ValidPassword123'
        });
        expect(badEmail.status).toBe(400);

        const tooLongPassword = await request(app).post('/api/auth/register').send({
            fullName: 'Long Password User',
            email: 'longpass@example.com',
            password: 'p'.repeat(73)
        });
        expect(tooLongPassword.status).toBe(400);

        const badLogin = await request(app).post('/api/auth/login').send({
            email: 'not-an-email',
            password: ''
        });
        expect(badLogin.status).toBe(400);
    });

    it('rejects invalid tone, slideCount: 99, and malformed outline/reorder payloads with 400', async () => {
        const { token } = await registerUser({ email: 'validator@example.com' });

        const created = await request(app)
            .post('/api/decks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                topic: 'Enterprise Cloud Strategy',
                tone: 'professional',
                slideCount: 5
            });
        expect(created.status).toBe(201);
        const deckId = created.body.deck._id;

        const invalidTone = await request(app)
            .patch(`/api/decks/${deckId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ tone: 'chaotic' });
        expect(invalidTone.status).toBe(400);

        const invalidSlideCount = await request(app)
            .patch(`/api/decks/${deckId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideCount: 99 });
        expect(invalidSlideCount.status).toBe(400);

        const invalidOutline = await request(app)
            .put(`/api/decks/${deckId}/outline`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sections: [{}] });
        expect(invalidOutline.status).toBe(400);

        const invalidReorder = await request(app)
            .patch(`/api/decks/${deckId}/slides/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideIds: ['not-an-object-id'] });
        expect(invalidReorder.status).toBe(400);

        const invalidSlideCreate = await request(app)
            .post(`/api/decks/${deckId}/slides`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'Valid Title', content: [12345] });
        expect(invalidSlideCreate.status).toBe(400);
    });

    it('errorMiddleware maps CastError/ValidationError to 400 and masks unexpected 500 error messages', () => {
        const makeRes = () => {
            const res = {
                statusCode: 200,
                payload: null,
                status(code) {
                    this.statusCode = code;
                    return this;
                },
                json(body) {
                    this.payload = body;
                    return this;
                }
            };
            return res;
        };

        const castRes = makeRes();
        errorMiddleware(new mongoose.Error.CastError('ObjectId', 'bad', '_id'), {}, castRes, () => {});
        expect(castRes.statusCode).toBe(400);

        const validationErr = new mongoose.Error.ValidationError();
        validationErr.addError('tone', new mongoose.Error.ValidatorError({ message: 'Invalid tone' }));
        const valRes = makeRes();
        errorMiddleware(validationErr, {}, valRes, () => {});
        expect(valRes.statusCode).toBe(400);

        const internalRes = makeRes();
        errorMiddleware(new Error('Sensitive stack detail: secret-uri'), {}, internalRes, () => {});
        expect(internalRes.statusCode).toBe(500);
        expect(internalRes.payload).toEqual({ message: 'Internal server error' });
    });

    it('returns 400 instead of 500 CastError for invalid ObjectId route params', async () => {
        expect(typeof paramsModule.routeParamObjectId).toBe('function');
        expect(() => paramsModule.routeParamObjectId('not-an-id', 'deckId')).toThrow();

        const { token } = await registerUser({ email: 'objectid@example.com' });

        const res = await request(app)
            .get('/api/decks/not-an-id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/deckId|invalid/i);
    });

    it('POST /api/auth/demo returns 200 { user, token, demo: true } and seeds 2 sample decks idempotently', async () => {
        const first = await request(app).post('/api/auth/demo');
        expect(first.status).toBe(200);
        expect(first.body.demo).toBe(true);
        expect(first.body.token).toEqual(expect.any(String));
        expect(first.body.user).toMatchObject({
            id: expect.any(String),
            email: expect.any(String),
            fullName: expect.any(String)
        });

        const second = await request(app).post('/api/auth/demo');
        expect(second.status).toBe(200);
        expect(second.body.demo).toBe(true);
        expect(second.body.user.id).toBe(first.body.user.id);

        const decksRes = await request(app)
            .get('/api/decks')
            .set('Authorization', `Bearer ${second.body.token}`);
        expect(decksRes.status).toBe(200);
        expect(decksRes.body.decks).toHaveLength(2);

        const readyDeck = decksRes.body.decks.find((d) => d.status === 'ready');
        const outlineReadyDeck = decksRes.body.decks.find((d) => d.status === 'outline_ready');

        expect(readyDeck).toBeDefined();
        expect(outlineReadyDeck).toBeDefined();
        expect(outlineReadyDeck.outline.sections).toHaveLength(5);

        const slidesRes = await request(app)
            .get(`/api/decks/${readyDeck._id}/slides`)
            .set('Authorization', `Bearer ${second.body.token}`);
        expect(slidesRes.status).toBe(200);
        expect(slidesRes.body.slides).toHaveLength(5);

        const layouts = new Set(slidesRes.body.slides.map((s) => s.layout));
        expect(layouts).toEqual(new Set(['title', 'content', 'two_column', 'section', 'summary']));

        const slideIds = slidesRes.body.slides.map((s) => s._id);
        const versionDocs = await SlideVersion.find({ slideId: { $in: slideIds } });
        expect(versionDocs).toHaveLength(1);
    });

    it('enforces cross-user isolation: User B requesting User A deck returns 404', async () => {
        const userA = await registerUser({ email: 'user-a@example.com' });
        const userB = await registerUser({ email: 'user-b@example.com' });

        const created = await request(app)
            .post('/api/decks')
            .set('Authorization', `Bearer ${userA.token}`)
            .send({
                topic: 'User A Private Board Deck',
                tone: 'persuasive',
                slideCount: 5
            });
        expect(created.status).toBe(201);
        const deckId = created.body.deck._id;

        const getRes = await request(app)
            .get(`/api/decks/${deckId}`)
            .set('Authorization', `Bearer ${userB.token}`);
        expect(getRes.status).toBe(404);

        const patchRes = await request(app)
            .patch(`/api/decks/${deckId}`)
            .set('Authorization', `Bearer ${userB.token}`)
            .send({ title: 'Unauthorized Edit' });
        expect(patchRes.status).toBe(404);
    });
});

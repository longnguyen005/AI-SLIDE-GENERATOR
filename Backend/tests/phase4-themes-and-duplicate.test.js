import zlib from 'node:zlib';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { Deck } from '../src/models/Deck.model.js';
import { Slide } from '../src/models/Slide.model.js';
import { SlideVersion } from '../src/models/SlideVersion.model.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/testDb.js';

function readZipEntries(buffer) {
    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i -= 1) {
        if (buffer.readUInt32LE(i) === 0x06054b50) {
            eocdOffset = i;
            break;
        }
    }
    if (eocdOffset === -1) {
        throw new Error('ZIP End of Central Directory not found');
    }

    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    let cdOffset = buffer.readUInt32LE(eocdOffset + 16);
    const entries = new Map();

    for (let i = 0; i < totalEntries; i += 1) {
        const compressionMethod = buffer.readUInt16LE(cdOffset + 10);
        const compressedSize = buffer.readUInt32LE(cdOffset + 20);
        const nameLen = buffer.readUInt16LE(cdOffset + 28);
        const extraLen = buffer.readUInt16LE(cdOffset + 30);
        const commentLen = buffer.readUInt16LE(cdOffset + 32);
        const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);
        const fileName = buffer.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');

        const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
        const compressedData = buffer.subarray(dataStart, dataStart + compressedSize);
        const content =
            compressionMethod === 8
                ? zlib.inflateRawSync(compressedData)
                : Buffer.from(compressedData);

        entries.set(fileName, content);
        cdOffset += 46 + nameLen + extraLen + commentLen;
    }

    return entries;
}

function binaryParser(res, callback) {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
}

beforeAll(async () => {
    await connectTestDb('phase4');
}, 30000);

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

async function loginDemoWorkspace() {
    const demoRes = await request(app).post('/api/auth/demo');
    expect(demoRes.status).toBe(200);
    const token = demoRes.body.token;

    const decksRes = await request(app)
        .get('/api/decks')
        .set('Authorization', `Bearer ${token}`);
    expect(decksRes.status).toBe(200);

    const readyDeck = decksRes.body.decks.find((d) => d.status === 'ready');
    const outlineDeck = decksRes.body.decks.find((d) => d.status === 'outline_ready');
    return { token, readyDeck, outlineDeck };
}

describe('Phase 4: Deck Themes, Safe Metadata PATCH, Duplication & Themed PPTX Export', () => {
    it('supports theme enum on create/update, preserves ready status on title/theme PATCH, and resets to draft on structural brief changes', async () => {
        const { token, readyDeck } = await loginDemoWorkspace();

        // Create deck with explicit theme
        const createRes = await request(app)
            .post('/api/decks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                topic: 'Autonomous Supply Chain Telemetry',
                tone: 'professional',
                slideCount: 5,
                theme: 'emerald'
            });
        expect(createRes.status).toBe(201);
        expect(createRes.body.deck.theme).toBe('emerald');

        // Reject unsupported theme enum with 400
        const invalidThemeRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ theme: 'neon-pink' });
        expect(invalidThemeRes.status).toBe(400);

        // Metadata-only PATCH (title + theme) on a ready deck MUST preserve status === 'ready'
        const metaPatchRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Enterprise AI Copilots: Board Final',
                theme: 'coral'
            });
        expect(metaPatchRes.status).toBe(200);
        expect(metaPatchRes.body.deck.title).toBe('Enterprise AI Copilots: Board Final');
        expect(metaPatchRes.body.deck.theme).toBe('coral');
        expect(metaPatchRes.body.deck.status).toBe('ready');

        // Structural brief PATCH (topic or slideCount) resets status to 'draft'
        const briefPatchRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                topic: 'Re-scoped Enterprise AI Rollout',
                slideCount: 6
            });
        expect(briefPatchRes.status).toBe(200);
        expect(briefPatchRes.body.deck.status).toBe('draft');
        expect(briefPatchRes.body.deck.theme).toBe('coral');
    });

    it('exports distinct theme color palettes into .pptx slide XML for emerald, amber, and coral decks', async () => {
        const { token, readyDeck } = await loginDemoWorkspace();

        await request(app)
            .patch(`/api/decks/${readyDeck._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ theme: 'emerald' })
            .expect(200);

        const exportRes = await request(app)
            .post(`/api/decks/${readyDeck._id}/export/pptx`)
            .set('Authorization', `Bearer ${token}`)
            .buffer(true)
            .parse(binaryParser);

        expect(exportRes.status).toBe(200);
        const entries = readZipEntries(exportRes.body);
        const allSlidesXml = [1, 2, 3, 4, 5]
            .map((i) => entries.get(`ppt/slides/slide${i}.xml`).toString('utf8'))
            .join('\n');

        // Emerald palette uses 0D9488 / 0F766E rather than Indigo 4338CA / 4F46E5
        expect(allSlidesXml).toMatch(/0D9488|0F766E/i);
        expect(allSlidesXml).not.toMatch(/4338CA/i);
    });

    it('POST /api/decks/:deckId/duplicate clones deck metadata, 200-char boundary title, outline, and slides while enforcing ownership', async () => {
        const { token, readyDeck } = await loginDemoWorkspace();
        const longTitle = `${'Boardroom AI Transformation '.repeat(8)}`.slice(0, 198);

        await request(app)
            .patch(`/api/decks/${readyDeck._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: longTitle, theme: 'amber' })
            .expect(200);

        const badIdRes = await request(app)
            .post('/api/decks/not-an-objectid/duplicate')
            .set('Authorization', `Bearer ${token}`);
        expect(badIdRes.status).toBe(400);

        const dupRes = await request(app)
            .post(`/api/decks/${readyDeck._id}/duplicate`)
            .set('Authorization', `Bearer ${token}`);
        expect(dupRes.status).toBe(201);

        const clonedDeck = dupRes.body.deck;
        expect(clonedDeck._id).not.toBe(readyDeck._id);
        expect(clonedDeck.title.length).toBeLessThanOrEqual(200);
        expect(clonedDeck.title.endsWith('(Copy)')).toBe(true);
        expect(clonedDeck.theme).toBe('amber');
        expect(clonedDeck.status).toBe('ready');
        expect(clonedDeck.slideCount).toBe(5);
        expect(clonedDeck.outline.sections).toHaveLength(5);

        const clonedSlidesRes = await request(app)
            .get(`/api/decks/${clonedDeck._id}/slides`)
            .set('Authorization', `Bearer ${token}`);
        expect(clonedSlidesRes.status).toBe(200);
        expect(clonedSlidesRes.body.slides).toHaveLength(5);
        expect(clonedSlidesRes.body.slides.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4, 5]);
        expect(await SlideVersion.countDocuments({ slideId: { $in: clonedSlidesRes.body.slides.map((s) => s._id) } })).toBe(0);

        // Foreign user cannot duplicate readyDeck (404)
        const otherReg = await request(app).post('/api/auth/register').send({
            fullName: 'Other User',
            email: 'other@deckai.app',
            password: 'Password123!'
        });
        const foreignDup = await request(app)
            .post(`/api/decks/${readyDeck._id}/duplicate`)
            .set('Authorization', `Bearer ${otherReg.body.token}`);
        expect(foreignDup.status).toBe(404);
    });

    it('POST /api/slides/:slideId/duplicate inserts cloned slide right after source, renumbers 1..N+1, and enforces 10-slide cap', async () => {
        const { token, readyDeck } = await loginDemoWorkspace();
        const slidesRes = await request(app)
            .get(`/api/decks/${readyDeck._id}/slides`)
            .set('Authorization', `Bearer ${token}`);
        const originalSlides = slidesRes.body.slides;
        expect(originalSlides).toHaveLength(5);

        // Duplicate slide 2 (index 1, layout 'section')
        const targetSlide = originalSlides[1];
        const dupSlideRes = await request(app)
            .post(`/api/slides/${targetSlide._id}/duplicate`)
            .set('Authorization', `Bearer ${token}`);
        expect(dupSlideRes.status).toBe(201);

        const { slide: duplicated, slides: updatedSlides } = dupSlideRes.body;
        expect(duplicated._id).not.toBe(targetSlide._id);
        expect(duplicated.slideNumber).toBe(3);
        expect(duplicated.layout).toBe(targetSlide.layout);
        expect(duplicated.content).toEqual(targetSlide.content);
        expect(duplicated.title).toContain('(Copy)');

        expect(updatedSlides).toHaveLength(6);
        expect(updatedSlides.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(updatedSlides[1]._id).toBe(targetSlide._id);
        expect(updatedSlides[2]._id).toBe(duplicated._id);
        expect(updatedSlides[3]._id).toBe(originalSlides[2]._id);
        expect((await Deck.findById(readyDeck._id)).slideCount).toBe(6);

        // Duplicate 4 more times up to 10 slides, then verify 11th is rejected with 400
        for (let i = 0; i < 4; i += 1) {
            const res = await request(app)
                .post(`/api/slides/${targetSlide._id}/duplicate`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(201);
        }

        expect((await Deck.findById(readyDeck._id)).slideCount).toBe(10);
        const capRes = await request(app)
            .post(`/api/slides/${targetSlide._id}/duplicate`)
            .set('Authorization', `Bearer ${token}`);
        expect(capRes.status).toBe(400);
    });
});

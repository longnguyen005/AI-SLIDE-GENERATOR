import zlib from 'node:zlib';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { Deck } from '../src/models/Deck.model.js';
import { Slide } from '../src/models/Slide.model.js';
import { SlideVersion } from '../src/models/SlideVersion.model.js';
import * as geminiService from '../src/services/gemini.service.js';
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
        if (buffer.readUInt32LE(cdOffset) !== 0x02014b50) {
            throw new Error(`Invalid Central Directory header at offset ${cdOffset}`);
        }
        const compressionMethod = buffer.readUInt16LE(cdOffset + 10);
        const compressedSize = buffer.readUInt32LE(cdOffset + 20);
        const nameLen = buffer.readUInt16LE(cdOffset + 28);
        const extraLen = buffer.readUInt16LE(cdOffset + 30);
        const commentLen = buffer.readUInt16LE(cdOffset + 32);
        const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);
        const fileName = buffer.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');

        if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
            throw new Error(`Invalid Local File header for ${fileName}`);
        }
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
    await connectTestDb('slides');
}, 30000);

afterAll(async () => {
    await disconnectTestDb();
});

beforeEach(async () => {
    await clearTestDb();
});

afterEach(() => {
    if (typeof geminiService.setModelPoolForTesting === 'function') {
        geminiService.setModelPoolForTesting(null);
    }
});

async function loginDemoAndGetReadyDeck() {
    const demoRes = await request(app).post('/api/auth/demo');
    expect(demoRes.status).toBe(200);
    const token = demoRes.body.token;

    const decksRes = await request(app)
        .get('/api/decks')
        .set('Authorization', `Bearer ${token}`);
    expect(decksRes.status).toBe(200);

    const readyDeck = decksRes.body.decks.find((d) => d.status === 'ready');
    expect(readyDeck).toBeDefined();

    const slidesRes = await request(app)
        .get(`/api/decks/${readyDeck._id}/slides`)
        .set('Authorization', `Bearer ${token}`);
    expect(slidesRes.status).toBe(200);

    return { token, readyDeck, slides: slidesRes.body.slides };
}

describe('Task 2: Backend Slide Lifecycle Fixes, Version Restore & 5-Layout PPTX Export', () => {
    it('re-generating slides after editing a ready deck outline replaces prior slides and versions cleanly (201)', async () => {
        const { token, readyDeck, slides: initialSlides } = await loginDemoAndGetReadyDeck();
        const oldSlideIds = initialSlides.map((s) => s._id);
        expect(await SlideVersion.countDocuments({ slideId: { $in: oldSlideIds } })).toBeGreaterThan(0);

        const updatedSections = [
            { title: 'Updated Executive Context', summary: 'Reframe strategic urgency for Q4.', order: 1 },
            { title: 'Pilot Telemetry Deep Dive', summary: 'Quantify cycle-time savings.', order: 2 },
            { title: 'Security Architecture Controls', summary: 'Detail RBAC and audit trails.', order: 3 },
            { title: 'Next-Quarter Rollout Plan', summary: 'Confirm phased budget milestones.', order: 4 }
        ];

        const outlineRes = await request(app)
            .put(`/api/decks/${readyDeck._id}/outline`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sections: updatedSections });
        expect(outlineRes.status).toBe(200);

        const regenRes = await request(app)
            .post(`/api/decks/${readyDeck._id}/slides/generate`)
            .set('Authorization', `Bearer ${token}`);

        expect(regenRes.status).toBe(201);
        expect(regenRes.body.slides).toHaveLength(4);
        expect(regenRes.body.slides.map((s) => s.title)).toEqual(updatedSections.map((s) => s.title));
        expect(regenRes.body.slides.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4]);

        // Old slides and their SlideVersion records must be cleaned up
        expect(await Slide.countDocuments({ _id: { $in: oldSlideIds } })).toBe(0);
        expect(await SlideVersion.countDocuments({ slideId: { $in: oldSlideIds } })).toBe(0);

        const refreshedDeck = await Deck.findById(readyDeck._id);
        expect(refreshedDeck.status).toBe('ready');
        expect(refreshedDeck.slideCount).toBe(4);
    });

    it('PATCH /api/decks/:deckId/slides/reorder rejects partial arrays and duplicate IDs with 400 and succeeds on full permutation', async () => {
        const { token, readyDeck, slides } = await loginDemoAndGetReadyDeck();
        expect(slides).toHaveLength(5);
        const ids = slides.map((s) => s._id);

        // Partial array must be rejected with 400
        const partialRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}/slides/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideIds: [ids[1], ids[0]] });
        expect(partialRes.status).toBe(400);

        // Duplicate IDs matching deck length must be rejected with 400
        const duplicateRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}/slides/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideIds: [ids[0], ids[0], ids[2], ids[3], ids[4]] });
        expect(duplicateRes.status).toBe(400);

        // Foreign ObjectId matching deck length must be rejected with 400
        const foreignId = new mongoose.Types.ObjectId().toString();
        const foreignRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}/slides/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideIds: [ids[0], ids[1], ids[2], ids[3], foreignId] });
        expect(foreignRes.status).toBe(400);

        // Full permutation succeeds with 200 and updates slideNumber 1..5
        const reversed = [...ids].reverse();
        const validRes = await request(app)
            .patch(`/api/decks/${readyDeck._id}/slides/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ slideIds: reversed });
        expect(validRes.status).toBe(200);
        expect(validRes.body.slides.map((s) => s._id)).toEqual(reversed);
        expect(validRes.body.slides.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4, 5]);
    });

    it('syncs deck.slideCount on create/delete, cleans up SlideVersion records, renumbers slides, and blocks deleting the last slide (400)', async () => {
        const { token, readyDeck, slides } = await loginDemoAndGetReadyDeck();
        expect(slides).toHaveLength(5);

        // Create slide -> deck.slideCount becomes 6
        const createRes = await request(app)
            .post(`/api/decks/${readyDeck._id}/slides`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Appendix: Unit Cost Breakdown',
                content: ['Compute spend per active seat stays below $14/month.'],
                layout: 'content'
            });
        expect(createRes.status).toBe(201);
        const afterCreateDeck = await Deck.findById(readyDeck._id);
        expect(afterCreateDeck.slideCount).toBe(6);

        // Find the slide that owns the seeded SlideVersion
        const seededVersion = await SlideVersion.findOne({});
        expect(seededVersion).not.toBeNull();
        const versionedSlideId = seededVersion.slideId.toString();

        // Delete the versioned slide -> cleans SlideVersion, renumbers 1..5, syncs deck.slideCount to 5
        const delRes = await request(app)
            .delete(`/api/slides/${versionedSlideId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(delRes.status).toBe(204);
        expect(await SlideVersion.countDocuments({ slideId: versionedSlideId })).toBe(0);

        const remainingAfterFirstDelete = await Slide.find({ deckId: readyDeck._id }).sort({ slideNumber: 1 });
        expect(remainingAfterFirstDelete).toHaveLength(5);
        expect(remainingAfterFirstDelete.map((s) => s.slideNumber)).toEqual([1, 2, 3, 4, 5]);
        expect((await Deck.findById(readyDeck._id)).slideCount).toBe(5);

        // Delete down to 1 slide
        for (let i = 0; i < 4; i += 1) {
            const res = await request(app)
                .delete(`/api/slides/${remainingAfterFirstDelete[i]._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(204);
        }

        const lastSlide = remainingAfterFirstDelete[4];
        expect((await Deck.findById(readyDeck._id)).slideCount).toBe(1);

        // Attempting to delete the last remaining slide returns 400
        const blockedRes = await request(app)
            .delete(`/api/slides/${lastSlide._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(blockedRes.status).toBe(400);
        expect(await Slide.countDocuments({ deckId: readyDeck._id })).toBe(1);
    });

    it('POST /api/slides/:slideId/versions/:versionId/restore snapshots current state and restores previous content and layout', async () => {
        const { token, slides } = await loginDemoAndGetReadyDeck();
        const twoColSlide = slides.find((s) => s.layout === 'two_column');
        expect(twoColSlide).toBeDefined();

        // Regenerate once (in stub mode) to capture a SlideVersion with layout: 'two_column'
        const regenRes = await request(app)
            .post(`/api/slides/${twoColSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ instruction: 'Add crisp contrast metrics' });
        expect(regenRes.status).toBe(200);

        const versionsBefore = await request(app)
            .get(`/api/slides/${twoColSlide._id}/versions`)
            .set('Authorization', `Bearer ${token}`);
        expect(versionsBefore.status).toBe(200);
        expect(versionsBefore.body.versions).toHaveLength(1);
        const versionToRestore = versionsBefore.body.versions[0];
        expect(versionToRestore.layout).toBe('two_column');

        // Mutate the live slide to different title, content, speakerNotes, and layout
        const patchRes = await request(app)
            .patch(`/api/slides/${twoColSlide._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Temporary Edited Summary Title',
                content: ['Single temporary bullet before restore'],
                speakerNotes: 'Temporary edited notes',
                layout: 'summary'
            });
        expect(patchRes.status).toBe(200);
        expect(patchRes.body.slide.layout).toBe('summary');

        // Invalid versionId format returns 400
        const badIdRes = await request(app)
            .post(`/api/slides/${twoColSlide._id}/versions/not-a-valid-id/restore`)
            .set('Authorization', `Bearer ${token}`);
        expect(badIdRes.status).toBe(400);

        // Restore version 1
        const restoreRes = await request(app)
            .post(`/api/slides/${twoColSlide._id}/versions/${versionToRestore._id}/restore`)
            .set('Authorization', `Bearer ${token}`);
        expect(restoreRes.status).toBe(200);
        expect(restoreRes.body.slide).toMatchObject({
            _id: twoColSlide._id,
            title: versionToRestore.title,
            content: versionToRestore.content,
            speakerNotes: versionToRestore.speakerNotes,
            layout: 'two_column'
        });

        // Verify a pre-restore SlideVersion snapshot was saved
        const versionsAfter = await request(app)
            .get(`/api/slides/${twoColSlide._id}/versions`)
            .set('Authorization', `Bearer ${token}`);
        expect(versionsAfter.status).toBe(200);
        expect(versionsAfter.body.versions).toHaveLength(2);
        const latestSnapshot = versionsAfter.body.versions[0];
        expect(latestSnapshot.versionNumber).toBe(2);
        expect(latestSnapshot.title).toBe('Temporary Edited Summary Title');
        expect(latestSnapshot.content).toEqual(['Single temporary bullet before restore']);
        expect(latestSnapshot.layout).toBe('summary');
    });

    it('retries when slot 1 returns malformed JSON, succeeds on slot 2 with markdown-fenced JSON, and preserves non-content layout in regenerateSlide', async () => {
        expect(typeof geminiService.extractJsonPayload).toBe('function');
        expect(typeof geminiService.callWithFallback).toBe('function');
        expect(typeof geminiService.setModelPoolForTesting).toBe('function');

        expect(geminiService.extractJsonPayload('```json\n{"ok":true}\n```')).toEqual({ ok: true });
        expect(() => geminiService.extractJsonPayload('{broken json')).toThrow();

        const calls = [];
        geminiService.setModelPoolForTesting([
            {
                label: 'slot-1-malformed',
                instance: {
                    async generateContent(prompt) {
                        calls.push({ slot: 1, prompt });
                        return {
                            response: {
                                text: () => '{ "title": "Truncated JSON without closing brace'
                            }
                        };
                    }
                }
            },
            {
                label: 'slot-2-fenced',
                instance: {
                    async generateContent(prompt) {
                        calls.push({ slot: 2, prompt });
                        return {
                            response: {
                                text: () =>
                                    '```json\n' +
                                    JSON.stringify({
                                        title: 'Sharpened Two-Column Security Tradeoffs',
                                        content: [
                                            'Velocity Enabler: Curated domain templates cut drafting time by 35%.',
                                            'Velocity Enabler: Multi-region routing maintains sub-2s latency.',
                                            'Security Guardrail: Zero-retention enterprise endpoints block training leakage.',
                                            'Security Guardrail: Strict ACL filters enforce workspace permissions.'
                                        ],
                                        speakerNotes: 'Highlight how both columns reinforce enterprise readiness.',
                                        layout: 'content'
                                    }) +
                                    '\n```'
                            }
                        };
                    }
                }
            }
        ]);

        const regenerated = await geminiService.regenerateSlide({
            topic: 'Enterprise AI Governance',
            language: 'English',
            tone: 'professional',
            previousTitle: 'Pilot Metrics',
            nextTitle: 'Execution Roadmap',
            instruction: 'Tighten executive phrasing',
            currentSlide: {
                title: 'Original Two-Column Title',
                content: ['Left 1', 'Right 1'],
                speakerNotes: 'Original speaker notes',
                layout: 'two_column'
            }
        });

        // Slot 1 failed twice on malformed JSON, then Slot 2 succeeded on attempt 1
        expect(calls.filter((c) => c.slot === 1)).toHaveLength(2);
        expect(calls.filter((c) => c.slot === 2)).toHaveLength(1);
        expect(calls[0].prompt).toContain('two_column');
        expect(calls[0].prompt).toContain('English');

        expect(regenerated.title).toBe('Sharpened Two-Column Security Tradeoffs');
        expect(regenerated.content).toHaveLength(4);
        expect(regenerated.layout).toBe('two_column');
    });

    it('exports a valid .pptx ZIP archive across all 5 slide layouts with slide XML, speaker notes, two-column geometry, and exportLimit headers', async () => {
        const { token, readyDeck, slides } = await loginDemoAndGetReadyDeck();
        expect(slides.map((s) => s.layout)).toEqual(['title', 'section', 'content', 'two_column', 'summary']);

        const exportRes = await request(app)
            .post(`/api/decks/${readyDeck._id}/export/pptx`)
            .set('Authorization', `Bearer ${token}`)
            .buffer(true)
            .parse(binaryParser);

        expect(exportRes.status).toBe(200);
        expect(exportRes.headers['content-type']).toContain(
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        );
        expect(exportRes.headers['content-disposition']).toMatch(/attachment; filename=".*\.pptx"/);
        // Dedicated exportLimit middleware sets a tighter limit than global apiLimiter (300)
        expect(Number(exportRes.headers['ratelimit-limit'])).toBeGreaterThan(0);
        expect(Number(exportRes.headers['ratelimit-limit'])).toBeLessThanOrEqual(60);

        const pptxBuffer = exportRes.body;
        expect(Buffer.isBuffer(pptxBuffer)).toBe(true);
        // Valid PK\x03\x04 ZIP header
        expect(pptxBuffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(true);

        const entries = readZipEntries(pptxBuffer);
        for (let i = 1; i <= 5; i += 1) {
            expect(entries.has(`ppt/slides/slide${i}.xml`)).toBe(true);
            expect(entries.has(`ppt/notesSlides/notesSlide${i}.xml`)).toBe(true);

            const slideXml = entries.get(`ppt/slides/slide${i}.xml`).toString('utf8');
            const notesXml = entries.get(`ppt/notesSlides/notesSlide${i}.xml`).toString('utf8');
            const expectedSlide = slides[i - 1];

            expect(slideXml).toContain(expectedSlide.title);
            for (const bullet of expectedSlide.content) {
                expect(slideXml).toContain(bullet);
            }
            expect(notesXml).toContain(expectedSlide.speakerNotes);
        }

        // Verify distinct 5-layout rendering markers & two-column horizontal split
        const titleXml = entries.get('ppt/slides/slide1.xml').toString('utf8');
        const sectionXml = entries.get('ppt/slides/slide2.xml').toString('utf8');
        const twoColumnXml = entries.get('ppt/slides/slide4.xml').toString('utf8');
        const summaryXml = entries.get('ppt/slides/slide5.xml').toString('utf8');

        expect(titleXml).toContain(readyDeck.topic);
        expect(sectionXml).toMatch(/SECTION/i);
        expect(summaryXml).toMatch(/TAKEAWAY|SUMMARY/i);

        // Two-column layout must position left and right bullets at distinct horizontal x coordinates
        const extractBulletX = (xml, snippet) => {
            const idx = xml.indexOf(snippet);
            expect(idx).toBeGreaterThan(0);
            const preceding = xml.slice(Math.max(0, idx - 1200), idx);
            const matches = [...preceding.matchAll(/<a:off x="(\d+)" y="(\d+)"/g)];
            expect(matches.length).toBeGreaterThan(0);
            return Number(matches[matches.length - 1][1]);
        };
        const leftX = extractBulletX(twoColumnXml, slides[3].content[0]);
        const rightX = extractBulletX(twoColumnXml, slides[3].content[2]);
        expect(rightX).toBeGreaterThan(leftX + 1000000);

        const exportsList = await request(app)
            .get(`/api/decks/${readyDeck._id}/exports`)
            .set('Authorization', `Bearer ${token}`);
        expect(exportsList.status).toBe(200);
        expect(exportsList.body.exports).toHaveLength(1);
    });
});

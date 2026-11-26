import zlib from 'node:zlib';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import {
    SLIDE_LAYOUTS,
    VALID_LAYOUTS,
    extractSharedColumnHeaders,
    parseMetricBullet,
    parseTimelineBullet,
    resolveEffectiveLayoutChange
} from '../src/constants/layouts.js';
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
    await connectTestDb('phase5');
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

describe('Phase 5 Backend: Gemini 2.5 Structured Outputs, 8-Layout Diversity, Smart Fallback & PPTX', () => {
    it('prioritizes gemini-2.5-flash and parses structured + plain bullets across all 8 layouts safely', () => {
        expect(loadEnv({}).geminiModels).toEqual([
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash'
        ]);
        expect(SLIDE_LAYOUTS).toEqual([
            'title',
            'section',
            'content',
            'two_column',
            'metrics',
            'timeline',
            'callout',
            'summary'
        ]);
        expect(VALID_LAYOUTS.has('metrics')).toBe(true);
        expect(VALID_LAYOUTS.has('timeline')).toBe(true);
        expect(VALID_LAYOUTS.has('callout')).toBe(true);

        expect(parseMetricBullet('34% Faster | Support cycle dropped from 38m to 25m', 0)).toEqual({
            value: '34% Faster',
            label: 'Support cycle dropped from 38m to 25m'
        });
        expect(parseMetricBullet('$18M Series A capital committed across lead funds', 1)).toEqual({
            value: '$18M',
            label: 'Series A capital committed across lead funds'
        });
        expect(parseMetricBullet('91% verified source citation accuracy across internal docs', 0)).toEqual({
            value: '91%',
            label: 'verified source citation accuracy across internal docs'
        });
        expect(parseMetricBullet('34% faster turnaround across 240 pilot seats', 0)).toEqual({
            value: '34% faster',
            label: 'turnaround across 240 pilot seats'
        });
        expect(parseMetricBullet('$18/seat target monthly platform spend', 1)).toEqual({
            value: '$18/seat',
            label: 'target monthly platform spend'
        });
        const barePipeMetric = parseMetricBullet('|', 0);
        expect(barePipeMetric.value).toBe('KPI 01');
        expect(barePipeMetric.label).not.toContain('|');

        const plainMetric = parseMetricBullet('Plain narrative bullet with no numbers at all', 2);
        expect(plainMetric.value).toBeTruthy();
        expect(plainMetric.label).toContain('Plain narrative bullet');

        expect(
            parseTimelineBullet('Phase 1 (Days 1-30): Finalize SSO role mappings and pilot seats', 0)
        ).toEqual({
            stage: 'Phase 1 (Days 1-30)',
            detail: 'Finalize SSO role mappings and pilot seats'
        });
        expect(parseTimelineBullet('Plain milestone without colon delimiter', 1)).toEqual({
            stage: 'Step 02',
            detail: 'Plain milestone without colon delimiter'
        });

        expect(
            extractSharedColumnHeaders(
                ['Velocity Enabler: Fast templates', 'Velocity Enabler: Low latency'],
                ['Security Guardrail: Strict ACLs', 'Security Guardrail: Zero retention']
            )
        ).toEqual({
            leftHeader: 'VELOCITY ENABLER',
            rightHeader: 'SECURITY GUARDRAIL'
        });

        expect(
            resolveEffectiveLayoutChange({
                target: 'full',
                instruction: 'Add Q3 KPI metrics and tighten summary points'
            })
        ).toEqual({ canChangeLayout: false, requestedLayout: null });

        expect(
            resolveEffectiveLayoutChange({
                target: 'full',
                instruction: 'Convert this slide into a timeline roadmap'
            })
        ).toEqual({ canChangeLayout: true, requestedLayout: 'timeline' });

        expect(
            resolveEffectiveLayoutChange({
                target: 'notes',
                allowLayoutChange: true,
                preferredLayout: 'metrics'
            })
        ).toEqual({ canChangeLayout: false, requestedLayout: null });
    });

    it('passes responseSchema to Gemini slots and eliminates monotonous adjacent middle layouts via enforceSlideDiversity', async () => {
        const capturedCalls = [];
        geminiService.setModelPoolForTesting([
            {
                label: 'mock-gemini-2.5-flash',
                instance: {
                    async generateContent(prompt, meta) {
                        capturedCalls.push({ prompt, meta });
                        if (prompt.includes('outline')) {
                            return {
                                response: {
                                    text: () =>
                                        JSON.stringify({
                                            title: 'Cloud FinOps Modernization',
                                            sections: [
                                                { title: 'Cloud Spend Visibility Crisis', summary: 'Context.' },
                                                { title: 'Core Architectural Thesis', summary: 'Thesis.' },
                                                { title: 'Unit Economics & Margin Telemetry', summary: '38% savings.' },
                                                { title: 'Centralized Policy vs Team Autonomy', summary: 'Tradeoffs.' },
                                                { title: 'Phased 90-Day Rollout', summary: 'Phase 1 to Phase 3.' },
                                                { title: 'Executive Approval & Next Steps', summary: 'Close.' }
                                            ]
                                        })
                                }
                            };
                        }
                        // Deliberately return monotonous 'content' on every middle slide
                        return {
                            response: {
                                text: () =>
                                    JSON.stringify({
                                        slides: [
                                            {
                                                title: 'Cloud Spend Visibility Crisis',
                                                content: ['Idle clusters consume 31% of monthly GPU spend.', 'Tagging coverage sits below 54%.', 'Establish automated FinOps guardrails.'],
                                                speakerNotes: 'Open with urgency.',
                                                layout: 'title'
                                            },
                                            {
                                                title: 'Core Architectural Thesis',
                                                content: ['Embed FinOps guardrails directly into CI/CD pipelines rather than monthly finance reviews.', 'Shift unit-cost telemetry left to pull requests.', 'Automate idle workload hibernation.'],
                                                speakerNotes: 'State core thesis.',
                                                layout: 'content'
                                            },
                                            {
                                                title: 'Unit Economics & Margin Telemetry',
                                                content: ['38% Lower | Compute waste eliminated within 45 days', '$1.4M Saved | Annualized Kubernetes rightsizing impact', '94% Tagged | Cost attribution coverage across prod'],
                                                speakerNotes: 'Highlight KPIs.',
                                                layout: 'content'
                                            },
                                            {
                                                title: 'Centralized Policy vs Team Autonomy',
                                                content: ['Platform Policy: Enforces hard budget quotas.', 'Platform Policy: Blocks untagged Terraform deploys.', 'Service Teams: Choose instance families.', 'Service Teams: Self-serve burst capacity.'],
                                                speakerNotes: 'Contrast tradeoffs.',
                                                layout: 'content'
                                            },
                                            {
                                                title: 'Phased 90-Day Rollout',
                                                content: ['Phase 1 (Days 1-30): Deploy telemetry agents.', 'Phase 2 (Days 31-60): Turn on PR cost estimates.', 'Phase 3 (Days 61-90): Automate rightsizing policies.'],
                                                speakerNotes: 'Walk through roadmap.',
                                                layout: 'content'
                                            },
                                            {
                                                title: 'Executive Approval & Next Steps',
                                                content: ['Approve FinOps policy engine rollout.', 'Assign engineering champions.', 'Review 60-day savings scorecard.'],
                                                speakerNotes: 'Close with decisions.',
                                                layout: 'summary'
                                            }
                                        ]
                                    })
                            }
                        };
                    }
                }
            }
        ]);

        const outline = await geminiService.generateOutline({
            topic: 'Cloud FinOps Modernization',
            description: 'Cut Kubernetes waste by 38% across 60 microservices.',
            language: 'English',
            tone: 'professional',
            slideCount: 6
        });

        expect(capturedCalls[0].prompt).toEqual(expect.any(String));
        expect(capturedCalls[0].meta?.generationConfig?.responseMimeType).toBe('application/json');
        expect(capturedCalls[0].meta?.generationConfig?.responseSchema).toBeTruthy();
        expect(outline.sections).toHaveLength(6);
        expect(outline.sections.every((sec) => VALID_LAYOUTS.has(sec.suggestedLayout))).toBe(true);

        // Strip suggestedLayout to prove enforceSlideDiversity breaks up monotonous LLM 'content' slides on its own
        const unpinnedSections = outline.sections.map(({ title, summary, order }) => ({
            title,
            summary,
            order
        }));

        const slides = await geminiService.generateSlides(
            {
                topic: 'Cloud FinOps Modernization',
                description: 'Cut Kubernetes waste by 38% across 60 microservices.',
                language: 'English',
                tone: 'professional',
                slideCount: 6
            },
            unpinnedSections
        );

        expect(capturedCalls[1].meta?.generationConfig?.responseMimeType).toBe('application/json');
        expect(capturedCalls[1].meta?.generationConfig?.responseSchema).toBeTruthy();
        expect(slides).toHaveLength(6);
        expect(slides[0].layout).toBe('title');
        expect(slides[5].layout).toBe('summary');

        const middleLayouts = slides.slice(1, 5).map((s) => s.layout);
        for (let i = 1; i < middleLayouts.length; i += 1) {
            expect(middleLayouts[i]).not.toBe(middleLayouts[i - 1]);
        }
        expect(new Set(middleLayouts).size).toBeGreaterThanOrEqual(3);
    });

    it('synthesizes diverse 8-layout decks in no-key Smart Fallback while keeping slide.title === section.title and preserving demo invariants', async () => {
        const demoRes = await request(app).post('/api/auth/demo');
        expect(demoRes.status).toBe(200);
        const token = demoRes.body.token;

        const decksRes = await request(app).get('/api/decks').set('Authorization', `Bearer ${token}`);
        expect(decksRes.body.decks).toHaveLength(2);

        const readyDeck = decksRes.body.decks.find((d) => d.status === 'ready');
        const outlineDeck = decksRes.body.decks.find((d) => d.status === 'outline_ready');
        expect(readyDeck.slideCount).toBe(5);
        expect(outlineDeck.outline.sections.some((s) => s.suggestedLayout === 'metrics')).toBe(true);
        expect(outlineDeck.outline.sections.some((s) => s.suggestedLayout === 'timeline')).toBe(true);
        expect(outlineDeck.outline.sections.some((s) => s.suggestedLayout === 'callout')).toBe(true);

        // Simulate a legacy DB document without suggestedLayout and verify /api/auth/demo backfills it idempotently
        await Deck.updateOne(
            { _id: outlineDeck._id },
            {
                $set: {
                    'outline.sections': outlineDeck.outline.sections.map(({ id, title, summary, order }) => ({
                        id,
                        title,
                        summary,
                        order
                    }))
                }
            }
        );
        await request(app).post('/api/auth/demo').expect(200);
        const reloadedOutlineDeck = await Deck.findById(outlineDeck._id);
        expect(reloadedOutlineDeck.outline.sections.map((s) => s.suggestedLayout)).toEqual([
            'title',
            'callout',
            'metrics',
            'two_column',
            'timeline'
        ]);

        // Generate slides from GridScale Storage outline deck in no-key fallback mode
        const genSlidesRes = await request(app)
            .post(`/api/decks/${outlineDeck._id}/slides/generate`)
            .set('Authorization', `Bearer ${token}`);
        expect(genSlidesRes.status).toBe(201);
        expect(genSlidesRes.body.slides).toHaveLength(5);
        expect(genSlidesRes.body.slides.map((s) => s.title)).toEqual(
            outlineDeck.outline.sections.map((s) => s.title)
        );
        expect(genSlidesRes.body.slides.map((s) => s.layout)).toEqual([
            'title',
            'callout',
            'metrics',
            'two_column',
            'timeline'
        ]);
        const metricsSlide = genSlidesRes.body.slides.find((s) => s.layout === 'metrics');
        expect(metricsSlide.content.some((line) => line.includes('|'))).toBe(true);

        // Verify PUT /outline and POST /duplicate preserve suggestedLayout
        const createDeckRes = await request(app)
            .post('/api/decks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                topic: 'Zero-Trust API Gateway Rollout',
                description: 'Cut token leakage risk across 42 regional services within 90 days.',
                tone: 'persuasive',
                slideCount: 6
            });
        expect(createDeckRes.status).toBe(201);
        const customDeckId = createDeckRes.body.deck._id;

        const genOutlineRes = await request(app)
            .post(`/api/decks/${customDeckId}/outline/generate`)
            .set('Authorization', `Bearer ${token}`);
        expect(genOutlineRes.status).toBe(200);
        expect(genOutlineRes.body.outline.sections).toHaveLength(6);
        expect(
            new Set(genOutlineRes.body.outline.sections.map((s) => s.suggestedLayout)).size
        ).toBeGreaterThanOrEqual(4);

        const editedSections = genOutlineRes.body.outline.sections.map((sec, idx) => ({
            ...sec,
            suggestedLayout: idx === 1 ? 'metrics' : idx === 2 ? '' : sec.suggestedLayout
        }));
        const saveOutlineRes = await request(app)
            .put(`/api/decks/${customDeckId}/outline`)
            .set('Authorization', `Bearer ${token}`)
            .send({ sections: editedSections });
        expect(saveOutlineRes.status).toBe(200);
        expect(saveOutlineRes.body.outline.sections[1].suggestedLayout).toBe('metrics');
        expect(saveOutlineRes.body.outline.sections[2].suggestedLayout).toBeUndefined();

        const dupRes = await request(app)
            .post(`/api/decks/${customDeckId}/duplicate`)
            .set('Authorization', `Bearer ${token}`);
        expect(dupRes.status).toBe(201);
        expect(dupRes.body.deck.outline.sections[1].suggestedLayout).toBe('metrics');

        // Generating slides when idx=2 is Auto (undefined) right before idx=3 ('two_column') must NOT create adjacent middle duplicates
        const genCustomSlidesRes = await request(app)
            .post(`/api/decks/${customDeckId}/slides/generate`)
            .set('Authorization', `Bearer ${token}`);
        expect(genCustomSlidesRes.status).toBe(201);
        const customMidLayouts = genCustomSlidesRes.body.slides.slice(1, 5).map((s) => s.layout);
        for (let i = 1; i < customMidLayouts.length; i += 1) {
            expect(customMidLayouts[i]).not.toBe(customMidLayouts[i - 1]);
        }
    });

    it('supports scoped regeneration (notes / bullets / full) and explicit layout switching without accidental hijacking', async () => {
        const demoRes = await request(app).post('/api/auth/demo');
        const token = demoRes.body.token;
        const decksRes = await request(app).get('/api/decks').set('Authorization', `Bearer ${token}`);
        const readyDeck = decksRes.body.decks.find((d) => d.status === 'ready');
        const slidesRes = await request(app)
            .get(`/api/decks/${readyDeck._id}/slides`)
            .set('Authorization', `Bearer ${token}`);

        const twoColSlide = slidesRes.body.slides.find((s) => s.layout === 'two_column');
        const contentSlide = slidesRes.body.slides.find((s) => s.layout === 'content');

        // 1. Ordinary prompt mentioning 'metrics' & 'summary' must NOT hijack two_column
        const nonHijackRes = await request(app)
            .post(`/api/slides/${twoColSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({ instruction: 'Add Q3 KPI metrics and tighten summary points' });
        expect(nonHijackRes.status).toBe(200);
        expect(nonHijackRes.body.slide.layout).toBe('two_column');
        expect(nonHijackRes.body.slide.title).not.toMatch(/\(Refined\)$/i);

        // 2. target: 'notes' preserves title, content, and layout while updating speakerNotes
        const beforeNotes = await Slide.findById(contentSlide._id).lean();
        const notesOnlyRes = await request(app)
            .post(`/api/slides/${contentSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                target: 'notes',
                instruction: 'Add executive coaching cues and transition to security guardrails'
            });
        expect(notesOnlyRes.status).toBe(200);
        expect(notesOnlyRes.body.slide.title).toBe(beforeNotes.title);
        expect(notesOnlyRes.body.slide.content).toEqual(beforeNotes.content);
        expect(notesOnlyRes.body.slide.layout).toBe(beforeNotes.layout);
        expect(notesOnlyRes.body.slide.speakerNotes).not.toBe(beforeNotes.speakerNotes);

        // 3. target: 'bullets' preserves title and speakerNotes while rewriting content
        const afterNotes = notesOnlyRes.body.slide;
        const bulletsOnlyRes = await request(app)
            .post(`/api/slides/${contentSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                target: 'bullets',
                instruction: 'Focus on quantifiable ROI and seat velocity'
            });
        expect(bulletsOnlyRes.status).toBe(200);
        expect(bulletsOnlyRes.body.slide.title).toBe(afterNotes.title);
        expect(bulletsOnlyRes.body.slide.speakerNotes).toBe(afterNotes.speakerNotes);
        expect(bulletsOnlyRes.body.slide.content).not.toEqual(afterNotes.content);

        // 4. preferredLayout: 'metrics' converts layout and structures stat cards
        const toMetricsRes = await request(app)
            .post(`/api/slides/${contentSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                target: 'full',
                preferredLayout: 'metrics',
                allowLayoutChange: true,
                instruction: 'Highlight pilot KPIs'
            });
        expect(toMetricsRes.status).toBe(200);
        expect(toMetricsRes.body.slide.layout).toBe('metrics');
        expect(toMetricsRes.body.slide.content.some((item) => item.includes('|'))).toBe(true);

        // 5. Explicit conversion verb in instruction switches to timeline when allowLayoutChange is omitted
        const toTimelineRes = await request(app)
            .post(`/api/slides/${contentSlide._id}/regenerate`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                instruction: 'Convert this slide into a timeline roadmap across 3 phases'
            });
        expect(toTimelineRes.status).toBe(200);
        expect(toTimelineRes.body.slide.layout).toBe('timeline');
        expect(await SlideVersion.countDocuments({ slideId: contentSlide._id })).toBeGreaterThanOrEqual(5);
    });

    it('exports valid .pptx XML for metrics, timeline, callout, and smart-header two_column (including plain fallback bullets)', async () => {
        const demoRes = await request(app).post('/api/auth/demo');
        const token = demoRes.body.token;

        const deckRes = await request(app)
            .post('/api/decks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                topic: '8-Archetype PPTX Verification',
                tone: 'professional',
                theme: 'emerald',
                slideCount: 5
            });
        const deckId = deckRes.body.deck._id;

        const slidePayloads = [
            {
                title: 'Formatted KPI Scorecard',
                layout: 'metrics',
                content: [
                    '34% Faster | Support triage dropped from 38m to 25m',
                    '$18M ARR | Net new enterprise expansion pipeline',
                    '99.4% Uptime | Multi-region availability across hubs'
                ]
            },
            {
                title: 'Plain Fallback Metrics Slide',
                layout: 'metrics',
                content: ['Plain bullet without pipe delimiter still renders cleanly']
            },
            {
                title: 'Phased Execution Roadmap',
                layout: 'timeline',
                content: [
                    'Phase 1 (Days 1-30): Audit IAM policies and baseline latency',
                    'Phase 2 (Days 31-60): Roll out policy gateway to 500 seats',
                    'Plain milestone step without colon'
                ]
            },
            {
                title: 'Core Governance Thesis',
                layout: 'callout',
                content: [
                    'Governance embedded at the gateway layer accelerates adoption faster than post-hoc security reviews.',
                    'Zero-retention model routing eliminates training leakage.',
                    'Role-scoped citations build immediate executive trust.'
                ]
            },
            {
                title: 'Velocity vs Guardrails Split',
                layout: 'two_column',
                content: [
                    'Velocity Enabler: Curated prompt templates cut drafting time.',
                    'Velocity Enabler: Multi-region routing maintains sub-2s p95.',
                    'Security Guardrail: Automated PII redaction on every prompt.',
                    'Security Guardrail: Immutable audit logs for SOC2 compliance.'
                ]
            }
        ];

        for (const payload of slidePayloads) {
            const createSlideRes = await request(app)
                .post(`/api/decks/${deckId}/slides`)
                .set('Authorization', `Bearer ${token}`)
                .send(payload);
            expect(createSlideRes.status).toBe(201);
        }

        const exportRes = await request(app)
            .post(`/api/decks/${deckId}/export/pptx`)
            .set('Authorization', `Bearer ${token}`)
            .buffer(true)
            .parse(binaryParser);
        expect(exportRes.status).toBe(200);

        const entries = readZipEntries(exportRes.body);
        const metricsXml = entries.get('ppt/slides/slide1.xml').toString('utf8');
        const plainMetricsXml = entries.get('ppt/slides/slide2.xml').toString('utf8');
        const timelineXml = entries.get('ppt/slides/slide3.xml').toString('utf8');
        const calloutXml = entries.get('ppt/slides/slide4.xml').toString('utf8');
        const twoColXml = entries.get('ppt/slides/slide5.xml').toString('utf8');

        expect(metricsXml).toContain('34% Faster');
        expect(metricsXml).toContain('Support triage dropped from 38m to 25m');
        expect(metricsXml).not.toContain('34% Faster | Support');

        expect(plainMetricsXml).toContain('Plain bullet without pipe delimiter still renders cleanly');
        expect(plainMetricsXml).not.toContain('undefined');

        expect(timelineXml).toMatch(/ROADMAP|MILESTONE/i);
        expect(timelineXml).toContain('Phase 1 (Days 1-30)');
        expect(timelineXml).toContain('Plain milestone step without colon');

        expect(calloutXml).toMatch(/CALLOUT|THESIS|SPOTLIGHT/i);
        expect(calloutXml).toContain('Governance embedded at the gateway layer');
        expect(calloutXml).toContain('Zero-retention model routing eliminates training leakage.');

        expect(twoColXml).toContain('VELOCITY ENABLER');
        expect(twoColXml).toContain('SECURITY GUARDRAIL');
        expect(twoColXml).toContain('Velocity Enabler: Curated prompt templates cut drafting time.');
    });
});

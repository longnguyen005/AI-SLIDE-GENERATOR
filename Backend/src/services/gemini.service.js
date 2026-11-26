import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env } from '../config/env.js';
import {
    SLIDE_LAYOUTS,
    VALID_LAYOUTS,
    resolveEffectiveLayoutChange
} from '../constants/layouts.js';
import {
    enforceOutlineDiversity,
    enforceSlideDiversity,
    formatBulletsForLayout,
    generateSmartOutline,
    generateSmartSlides,
    regenerateSmartSlide
} from './smartFallback.service.js';
import { makeId } from '../utils/ids.js';

export const OUTLINE_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        sections: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    summary: { type: SchemaType.STRING },
                    suggestedLayout: {
                        type: SchemaType.STRING,
                        format: 'enum',
                        enum: SLIDE_LAYOUTS
                    }
                },
                required: ['title', 'summary']
            }
        }
    },
    required: ['title', 'sections']
};

export const SLIDES_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        slides: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    content: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING }
                    },
                    speakerNotes: { type: SchemaType.STRING },
                    layout: {
                        type: SchemaType.STRING,
                        format: 'enum',
                        enum: SLIDE_LAYOUTS
                    }
                },
                required: ['title', 'content', 'speakerNotes', 'layout']
            }
        }
    },
    required: ['slides']
};

export const REGENERATE_RESPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING },
        content: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        },
        speakerNotes: { type: SchemaType.STRING },
        layout: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: SLIDE_LAYOUTS
        }
    },
    required: ['title', 'content', 'speakerNotes', 'layout']
};

/* ── Model pool: every (key × model) combination ────────── */

const defaultPool = [];
for (const apiKey of env.geminiApiKeys) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of env.geminiModels) {
        defaultPool.push({
            label: `${modelName} (key …${apiKey.slice(-4)})`,
            genAI,
            modelName,
            instance: genAI.getGenerativeModel({ model: modelName })
        });
    }
}

let activePool = defaultPool;

if (process.env.NODE_ENV !== 'test') {
    if (defaultPool.length) {
        console.info(
            `[Gemini] Initialized ${defaultPool.length} model slots: ${defaultPool.map((p) => p.label).join(', ')}`
        );
    } else {
        console.warn('[Gemini] No API keys configured — AI features will use smart fallback synthesis.');
    }
}

export function setModelPoolForTesting(slots) {
    activePool = Array.isArray(slots) ? slots : defaultPool;
}

/* ── Helpers ──────────────────────────────────────────────── */

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractJsonPayload(text) {
    if (typeof text !== 'string' || !text.trim()) {
        throw new SyntaxError('Empty AI response payload');
    }

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenceMatch ? fenceMatch[1] : text).trim();

    try {
        return JSON.parse(candidate);
    } catch {
        const firstBrace = candidate.indexOf('{');
        const lastBrace = candidate.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
        }

        const firstBracket = candidate.indexOf('[');
        const lastBracket = candidate.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            return JSON.parse(candidate.slice(firstBracket, lastBracket + 1));
        }

        throw new SyntaxError('Failed to parse JSON payload from AI response');
    }
}

function isRetryableError(err) {
    if (err instanceof SyntaxError || err?.name === 'SyntaxError') {
        return true;
    }
    const status = Number(err?.status || err?.httpStatusCode || err?.code || 0);
    const msg = (err?.message || '').toLowerCase();
    return (
        [429, 503, 500].includes(status) ||
        msg.includes('overloaded') ||
        msg.includes('rate limit') ||
        msg.includes('resource exhausted') ||
        msg.includes('too many requests') ||
        msg.includes('service unavailable')
    );
}

function friendlyError(err) {
    if (err instanceof SyntaxError || err?.name === 'SyntaxError') {
        return 'AI service returned an invalid response format. Please try again.';
    }
    const msg = (err?.message || '').toLowerCase();
    if (
        msg.includes('429') ||
        msg.includes('rate limit') ||
        msg.includes('resource exhausted') ||
        msg.includes('too many requests') ||
        msg.includes('quota')
    ) {
        return 'AI service is currently overloaded. Please wait a moment and try again.';
    }
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable')) {
        return 'AI service is temporarily unavailable. Please try again in a few seconds.';
    }
    if (msg.includes('500')) {
        return 'AI service encountered an internal error. Please try again.';
    }
    return err?.message || 'An unexpected AI error occurred. Please try again.';
}

const MAX_RETRIES_PER_SLOT = 2;
const BASE_DELAY_MS = process.env.NODE_ENV === 'test' ? 1 : 1500;

export async function callWithFallback(prompt, options = {}) {
    const slots = options.slots ?? activePool;
    const baseDelayMs = options.baseDelayMs ?? BASE_DELAY_MS;
    const generationConfig = options.responseSchema
        ? {
              responseMimeType: 'application/json',
              responseSchema: options.responseSchema,
              ...(options.temperature !== undefined ? { temperature: options.temperature } : {})
          }
        : undefined;

    if (slots.length === 0) {
        return null;
    }

    let lastError;

    for (let i = 0; i < slots.length; i += 1) {
        const slot = slots[i];
        const { label, instance } = slot;

        for (let attempt = 0; attempt < MAX_RETRIES_PER_SLOT; attempt += 1) {
            try {
                if (attempt > 0 || i > 0) {
                    const delay = baseDelayMs * Math.pow(2, attempt);
                    if (delay > 0) {
                        await sleep(delay);
                    }
                }

                let result;
                if (slot.genAI && slot.modelName && (generationConfig || options.systemInstruction)) {
                    const configuredModel = slot.genAI.getGenerativeModel({
                        model: slot.modelName,
                        ...(options.systemInstruction
                            ? { systemInstruction: options.systemInstruction }
                            : {}),
                        ...(generationConfig ? { generationConfig } : {})
                    });
                    result = await configuredModel.generateContent(prompt);
                } else {
                    result = await instance.generateContent(prompt, {
                        ...(generationConfig ? { generationConfig } : {}),
                        ...(options.systemInstruction
                            ? { systemInstruction: options.systemInstruction }
                            : {})
                    });
                }

                const rawText =
                    typeof result?.response?.text === 'function'
                        ? result.response.text()
                        : String(result?.text ?? '');
                const parsed = extractJsonPayload(rawText);

                if ((i > 0 || attempt > 0) && process.env.NODE_ENV !== 'test') {
                    console.info(`[Gemini] Succeeded with ${label} (attempt ${attempt + 1})`);
                }
                return parsed;
            } catch (err) {
                if (!isRetryableError(err)) {
                    const error = new Error(friendlyError(err));
                    error.statusCode = err?.status || err?.httpStatusCode || 500;
                    throw error;
                }

                if (process.env.NODE_ENV !== 'test') {
                    console.warn(
                        `[Gemini] ${label} attempt ${attempt + 1} failed: ${(err.message || '').slice(0, 100)}`
                    );
                }
                lastError = err;
            }
        }

        if (i < slots.length - 1 && process.env.NODE_ENV !== 'test') {
            console.warn(`[Gemini] Switching to next slot: ${slots[i + 1].label}`);
        }
    }

    const error = new Error(friendlyError(lastError));
    error.statusCode = lastError instanceof SyntaxError || lastError?.name === 'SyntaxError' ? 502 : 429;
    throw error;
}

/* ── Public API ───────────────────────────────────────────── */

export async function generateOutline(input) {
    const targetCount = Math.min(10, Math.max(1, Number(input.slideCount) || 5));
    const parsed = await callWithFallback(
        `
Return strict JSON only. Do not wrap in markdown.
Create a premium executive presentation outline with exactly ${targetCount} sections.
Topic: "${input.topic}"
Description/context: "${input.description || ''}"
Language: ${input.language || 'English'}
Tone: ${input.tone}

Available slide layouts (assign suggestedLayout for each section):
- "title": Opening cover slide (use for section 1)
- "callout": Core thesis spotlight banner + 2-3 supporting pillars
- "metrics": KPI scorecard grid with quantifiable figures ("34% Faster | Context")
- "two_column": Side-by-side comparison / tradeoffs ("Driver: ..." vs "Guardrail: ...")
- "timeline": Phased roadmap / sequential milestones ("Phase 1: ...")
- "section": Chapter divider transition
- "content": Focused insight bullets + visual panel
- "summary": Closing decisions & executive takeaways (use for final section when >= 3 slides)

Requirements:
- Build a compelling narrative arc across diverse visual archetypes; never repeat the same middle layout back-to-back.
- Use sharp, insight-driven section titles rather than generic labels like "Introduction".
- Each summary must be 2-3 crisp sentences with concrete angles, evidence, or decision points.
`,
        {
            responseSchema: OUTLINE_RESPONSE_SCHEMA,
            temperature: 0.55
        }
    );

    if (!parsed) {
        return generateSmartOutline(input);
    }

    const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
    const padded = Array.from({ length: targetCount }, (_, index) => {
        const candidate = rawSections[index];
        return {
            id: makeId(),
            title: String(candidate?.title || `${input.topic} — Key Angle ${index + 1}`),
            summary: String(
                candidate?.summary ||
                    `Synthesize concrete ${input.tone} evidence and implications for ${input.topic}.`
            ),
            order: index + 1,
            suggestedLayout: VALID_LAYOUTS.has(candidate?.suggestedLayout)
                ? candidate.suggestedLayout
                : undefined
        };
    });

    return {
        title: String(parsed.title || input.topic),
        sections: enforceOutlineDiversity(padded)
    };
}

export async function generateSlides(deck, outline) {
    const parsed = await callWithFallback(
        `
Return strict JSON only. Do not wrap in markdown.
Create exactly ${outline.length} executive presentation slides across our 8-layout archetype system.
Deck topic: "${deck.topic}"
Deck description/context: "${deck.description || ''}"
Language: ${deck.language || 'English'}
Tone: ${deck.tone}
Outline (respect each section's suggestedLayout when provided): ${JSON.stringify(outline)}

Layout formatting conventions (content is string[]):
- "title": 3 framing highlights; content[0] is the hero executive lead sentence.
- "metrics": 3-4 KPI stat strings formatted strictly as "Stat Figure | Crisp explanation" (e.g. "34% Faster | Support cycle time dropped from 38m to 25m").
- "timeline": 3-4 sequential phases formatted strictly as "Stage Label: Milestone action" (e.g. "Phase 1 (Days 1-30): Audit IAM roles and launch pilot").
- "two_column": 4 or 6 balanced strings using shared prefixes per half (e.g. first half "Velocity Driver: ...", second half "Risk Guardrail: ...").
- "callout": content[0] is a bold core thesis statement; content[1..3] are supporting proof pillars.
- "section": 2-3 chapter transition cues.
- "content": 3-5 concise insight bullets (9-16 words each).
- "summary": 3-5 actionable closing takeaways or sign-off decisions.

Quality rules:
- Never use consecutive identical middle layouts; vary visual rhythm across the deck.
- Write concrete claims, tradeoffs, benchmarks, and presenter-ready 2-4 sentence speakerNotes.
`,
        {
            responseSchema: SLIDES_RESPONSE_SCHEMA,
            temperature: 0.55
        }
    );

    if (!parsed) {
        return generateSmartSlides(deck, outline);
    }

    const rawSlides = Array.isArray(parsed.slides) ? parsed.slides : [];
    return enforceSlideDiversity(rawSlides, outline, deck);
}

export async function regenerateSlide(input) {
    const target = ['full', 'bullets', 'notes'].includes(input.target) ? input.target : 'full';
    const preservedLayout = VALID_LAYOUTS.has(input.currentSlide?.layout)
        ? input.currentSlide.layout
        : 'content';
    const language = input.language || 'English';
    const instruction = input.instruction || 'Improve executive clarity and concrete impact';

    const { canChangeLayout, requestedLayout } = resolveEffectiveLayoutChange({
        target,
        allowLayoutChange: input.allowLayoutChange,
        preferredLayout: input.preferredLayout,
        instruction
    });

    const layoutDirective = canChangeLayout
        ? requestedLayout
            ? `Switch layout to "${requestedLayout}" and format content[] using "${requestedLayout}" conventions.`
            : `Choose the best layout among ${SLIDE_LAYOUTS.join(', ')} (currently "${preservedLayout}").`
        : `Preserve layout "${preservedLayout}".`;

    const scopeDirective =
        target === 'notes'
            ? 'Rewrite speakerNotes ONLY (3-4 coaching sentences with transitions from previousTitle to nextTitle); keep title, content, and layout unchanged.'
            : target === 'bullets'
              ? 'Rewrite content[] bullets ONLY; keep title and speakerNotes unchanged.'
              : 'Regenerate title, content[], and speakerNotes cohesively.';

    const parsed = await callWithFallback(
        `Return strict JSON only. Do not wrap in markdown. Regenerate one slide in ${language} for deck topic "${input.topic}", context "${input.description || ''}", tone "${input.tone}". ${layoutDirective} ${scopeDirective} Layout formatting rules: metrics="Stat | Detail", timeline="Phase N: Detail", two_column="Left Prefix: ... / Right Prefix: ...", callout="content[0]=thesis, content[1..3]=pillars". Current slide: ${JSON.stringify(input.currentSlide)}. Previous title: ${input.previousTitle || ''}. Next title: ${input.nextTitle || ''}. Instruction: ${instruction}.`,
        {
            responseSchema: REGENERATE_RESPONSE_SCHEMA,
            temperature: 0.6
        }
    );

    if (!parsed) {
        return regenerateSmartSlide({
            ...input,
            target,
            instruction
        });
    }

    const finalLayout = canChangeLayout
        ? requestedLayout || (VALID_LAYOUTS.has(parsed.layout) ? parsed.layout : preservedLayout)
        : preservedLayout;

    if (target === 'notes') {
        return {
            title: String(input.currentSlide?.title || 'Untitled slide'),
            content: Array.isArray(input.currentSlide?.content)
                ? input.currentSlide.content.map(String)
                : [],
            speakerNotes: String(parsed.speakerNotes || input.currentSlide?.speakerNotes || ''),
            layout: preservedLayout
        };
    }

    let nextContent = Array.isArray(parsed.content) && parsed.content.length > 0
        ? parsed.content.map(String)
        : Array.isArray(input.currentSlide?.content)
          ? input.currentSlide.content.map(String)
          : [];

    if (
        (canChangeLayout && finalLayout !== preservedLayout) ||
        nextContent.length === 0
    ) {
        nextContent = formatBulletsForLayout(nextContent, finalLayout, parsed.title || input.currentSlide?.title, {
            topic: input.topic,
            description: input.description
        });
    }

    if (target === 'bullets') {
        return {
            title: String(input.currentSlide?.title || 'Untitled slide'),
            content: nextContent,
            speakerNotes: String(input.currentSlide?.speakerNotes ?? ''),
            layout: finalLayout
        };
    }

    return {
        title: String(parsed.title || input.currentSlide?.title || 'Untitled slide'),
        content: nextContent,
        speakerNotes: String(parsed.speakerNotes ?? input.currentSlide?.speakerNotes ?? ''),
        layout: finalLayout
    };
}

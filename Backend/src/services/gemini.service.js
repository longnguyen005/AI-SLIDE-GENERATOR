import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { makeId } from '../utils/ids.js';

/* ── Model pool with fallback ─────────────────────────────── */

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

const models = genAI
    ? env.geminiModels.map((name) => ({
          name,
          instance: genAI.getGenerativeModel({ model: name })
      }))
    : [];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try each model in order. If a model fails with a retryable error
 * (429 / 503 / 500 / overloaded), wait briefly then try the next one.
 * Non-retryable errors are thrown immediately.
 */
async function callWithFallback(prompt) {
    if (models.length === 0) return null; // no API key → caller uses stub

    let lastError;

    for (let i = 0; i < models.length; i++) {
        const { name, instance } = models[i];
        try {
            const result = await instance.generateContent(prompt);
            if (i > 0) {
                console.info(`[Gemini] ✓ Succeeded with fallback model: ${name}`);
            }
            return result;
        } catch (err) {
            const status = err?.status || err?.httpStatusCode || err?.code;
            const msg = err?.message || '';
            const isRetryable =
                [429, 503, 500].includes(Number(status)) ||
                msg.toLowerCase().includes('overloaded') ||
                msg.toLowerCase().includes('rate limit') ||
                msg.toLowerCase().includes('resource exhausted') ||
                msg.toLowerCase().includes('too many requests') ||
                msg.toLowerCase().includes('service unavailable');

            if (!isRetryable) throw err;

            console.warn(
                `[Gemini] ✗ Model "${name}" failed (${status || msg.slice(0, 80)}). ` +
                    (i < models.length - 1
                        ? `Trying next model "${models[i + 1].name}"...`
                        : 'No more fallback models.')
            );
            lastError = err;

            // Brief pause before trying next model
            if (i < models.length - 1) await sleep(1000);
        }
    }

    // All models exhausted
    throw lastError;
}

/* ── Helpers ──────────────────────────────────────────────── */

function parseJson(text) {
    const trimmed = text.replace(/```json|```/g, '').trim();
    return JSON.parse(trimmed);
}

/* ── Public API ───────────────────────────────────────────── */

export async function generateOutline(input) {
    const result = await callWithFallback(`
Return strict JSON only. Do not wrap in markdown.
Shape:
{"title":"string","sections":[{"title":"string","summary":"string"}]}

Create a premium presentation outline with exactly ${input.slideCount} sections.
Topic: "${input.topic}"
Description/context: "${input.description || ''}"
Language: ${input.language || 'English'}
Tone: ${input.tone}

Requirements:
- Build a strong narrative arc: context, problem/opportunity, evidence, implications, recommendations, closing takeaway.
- Use action-oriented section titles, not generic labels like "Introduction" unless paired with a specific insight.
- Each summary must be 2-3 concise sentences with specific angles, examples, or decision points.
- Avoid vague filler such as "discuss the topic" or "cover key points".
- Make the outline presentation-ready for a polished SaaS/business deck.
`);

    if (!result) {
        // Stub fallback when no API key is configured
        return {
            title: input.topic,
            sections: Array.from({ length: input.slideCount }, (_, index) => ({
                id: makeId(),
                title: index === 0 ? `Why ${input.topic} matters now` : `${input.topic} - Strategic point ${index + 1}`,
                summary: `Frame one specific ${input.tone} insight, include supporting context, and end with a presenter-ready takeaway.`,
                order: index + 1
            }))
        };
    }

    const parsed = parseJson(result.response.text());
    return {
        title: String(parsed.title || input.topic),
        sections: parsed.sections.slice(0, input.slideCount).map((section, index) => ({
            id: makeId(),
            title: String(section.title || `Slide ${index + 1}`),
            summary: String(section.summary || ''),
            order: index + 1
        }))
    };
}

export async function generateSlides(deck, outline) {
    const result = await callWithFallback(`
Return strict JSON only. Do not wrap in markdown.
Shape:
{"slides":[{"title":"string","content":["string"],"speakerNotes":"string","layout":"title|content|two_column|section|summary"}]}

Create exactly ${outline.length} polished presentation slides.
Deck topic: "${deck.topic}"
Deck description/context: "${deck.description || ''}"
Language: ${deck.language || 'English'}
Tone: ${deck.tone}
Outline: ${JSON.stringify(outline)}

Slide quality requirements:
- Make every slide title an insight headline, not a topic label.
- Content must be 3-5 concise bullets per slide, 9-16 words each.
- Bullets should include concrete claims, examples, tradeoffs, recommendations, or measurable outcomes when possible.
- Avoid generic filler, repeated phrasing, and textbook definitions.
- Use a clear narrative flow from opening context to final recommendation.
- Vary layout across the deck: first slide should be "title", final slide should be "summary", and middle slides should mix "content" and "two_column" when useful.
- Speaker notes must be 2-4 sentences with presenter guidance, transitions, and emphasis points.
- Keep text readable on a slide; do not create long paragraphs inside content bullets.
- Write bullets so they can pair with a visual metaphor, light data panel, or icon-based illustration on the slide.
- When useful, include one bullet that suggests a concrete visual angle such as trend, contrast, timeline, system map, or impact signal, but keep it audience-facing.
`);

    if (!result) {
        // Stub fallback when no API key is configured
        return outline.map((section, index) => ({
            slideNumber: index + 1,
            title: section.title,
            content: [
                section.summary || `Frame the core insight behind ${section.title}.`,
                `Add one concrete example, implication, or metric relevant to ${deck.topic}.`,
                'End with a clear audience takeaway or next action.'
            ],
            speakerNotes: `Present the insight, explain why it matters for ${deck.topic}, then connect it to the next slide.`,
            layout: index === 0 ? 'title' : index === outline.length - 1 ? 'summary' : 'content'
        }));
    }

    return parseJson(result.response.text()).slides;
}

export async function regenerateSlide(input) {
    const result = await callWithFallback(
        `Return strict JSON only with shape {"title":"string","content":["string"],"speakerNotes":"string","layout":"content"}. Regenerate one English slide for deck topic "${input.topic}", tone "${input.tone}". Current slide: ${JSON.stringify(input.currentSlide)}. Previous title: ${input.previousTitle || ''}. Next title: ${input.nextTitle || ''}. Instruction: ${input.instruction || 'Improve clarity'}.`
    );

    if (!result) {
        // Stub fallback when no API key is configured
        return {
            ...input.currentSlide,
            title: input.currentSlide.title,
            content: input.currentSlide.content.map((line) => `${line}`),
            speakerNotes: `${input.currentSlide.speakerNotes || ''}\nRegenerated with instruction: ${input.instruction || 'Polish the slide.'}`.trim()
        };
    }

    return parseJson(result.response.text());
}

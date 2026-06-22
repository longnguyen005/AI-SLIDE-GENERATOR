import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { makeId } from '../utils/ids.js';
const model = env.geminiApiKey
    ? new GoogleGenerativeAI(env.geminiApiKey).getGenerativeModel({ model: 'gemini-1.5-flash' })
    : null;
function parseJson(text) {
    const trimmed = text.replace(/```json|```/g, '').trim();
    return JSON.parse(trimmed);
}
export async function generateOutline(input) {
    if (!model) {
        return {
            title: input.topic,
            sections: Array.from({ length: input.slideCount }, (_, index) => ({
                id: makeId(),
                title: index === 0 ? input.topic : `${input.topic} - Part ${index + 1}`,
                summary: `A ${input.tone} slide covering key point ${index + 1}.`,
                order: index + 1
            }))
        };
    }
    const result = await model.generateContent(`Return strict JSON only with shape {"title":"string","sections":[{"title":"string","summary":"string"}]}. Generate ${input.slideCount} English slide outline sections for topic "${input.topic}", description "${input.description || ''}", tone "${input.tone}".`);
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
    if (!model) {
        return outline.map((section, index) => ({
            slideNumber: index + 1,
            title: section.title,
            content: [
                section.summary || `Introduce the core idea of ${section.title}.`,
                `Keep the message ${deck.tone} and easy to present.`,
                'Close with a clear takeaway.'
            ],
            speakerNotes: `Explain ${section.title} in the context of ${deck.topic}.`,
            layout: index === 0 ? 'title' : index === outline.length - 1 ? 'summary' : 'content'
        }));
    }
    const result = await model.generateContent(`Return strict JSON only with shape {"slides":[{"title":"string","content":["string"],"speakerNotes":"string","layout":"content"}]}. Create ${outline.length} English slides for topic "${deck.topic}" using tone "${deck.tone}". Outline: ${JSON.stringify(outline)}. Layout must be one of title, content, two_column, section, summary.`);
    return parseJson(result.response.text()).slides;
}
export async function regenerateSlide(input) {
    if (!model) {
        return {
            ...input.currentSlide,
            title: input.currentSlide.title,
            content: input.currentSlide.content.map((line) => `${line}`),
            speakerNotes: `${input.currentSlide.speakerNotes || ''}\nRegenerated with instruction: ${input.instruction || 'Polish the slide.'}`.trim()
        };
    }
    const result = await model.generateContent(`Return strict JSON only with shape {"title":"string","content":["string"],"speakerNotes":"string","layout":"content"}. Regenerate one English slide for deck topic "${input.topic}", tone "${input.tone}". Current slide: ${JSON.stringify(input.currentSlide)}. Previous title: ${input.previousTitle || ''}. Next title: ${input.nextTitle || ''}. Instruction: ${input.instruction || 'Improve clarity'}.`);
    return parseJson(result.response.text());
}

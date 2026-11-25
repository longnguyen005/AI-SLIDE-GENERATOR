import { getOwnedDeck } from './deck.controller.js';
import { Slide } from '../models/Slide.model.js';
import { SlideVersion } from '../models/SlideVersion.model.js';
import { generateOutline, generateSlides } from '../services/gemini.service.js';
import { ApiError } from '../utils/ApiError.js';
import { makeId } from '../utils/ids.js';
import { routeParamObjectId } from '../utils/params.js';

const VALID_LAYOUTS = new Set(['title', 'content', 'two_column', 'section', 'summary']);

export async function generateDeckOutline(req, res) {
    const deck = await getOwnedDeck(routeParamObjectId(req.params.deckId, 'deckId'), req.user.id);
    const outline = await generateOutline({
        topic: deck.topic,
        description: deck.description,
        language: deck.language,
        tone: deck.tone,
        slideCount: deck.slideCount
    });
    deck.title = outline.title;
    deck.outline = { sections: outline.sections };
    deck.status = 'outline_ready';
    await deck.save();
    res.json({ deck, outline: deck.outline });
}

export async function getOutline(req, res) {
    const deck = await getOwnedDeck(routeParamObjectId(req.params.deckId, 'deckId'), req.user.id);
    res.json({ outline: deck.outline || { sections: [] } });
}

export async function updateOutline(req, res) {
    const deck = await getOwnedDeck(routeParamObjectId(req.params.deckId, 'deckId'), req.user.id);
    deck.outline = {
        sections: req.body.sections.map((section, index) => ({
            id: section.id || makeId(),
            title: section.title,
            summary: section.summary || '',
            order: index + 1
        }))
    };
    deck.slideCount = deck.outline.sections.length;
    deck.status = 'outline_ready';
    await deck.save();
    res.json({ outline: deck.outline });
}

export async function generateDeckSlides(req, res) {
    const deck = await getOwnedDeck(routeParamObjectId(req.params.deckId, 'deckId'), req.user.id);
    const sections = [...(deck.outline?.sections || [])]
        .sort((a, b) => a.order - b.order)
        .map((section) => ({
            title: String(section.title),
            summary: section.summary ? String(section.summary) : undefined,
            order: Number(section.order)
        }));

    if (sections.length === 0) {
        throw new ApiError(400, 'Generate or save a deck outline before generating slides');
    }

    const generated = await generateSlides(
        {
            topic: deck.topic,
            description: deck.description,
            language: deck.language,
            tone: deck.tone,
            slideCount: sections.length
        },
        sections
    );

    if (!Array.isArray(generated) || generated.length === 0) {
        throw new ApiError(502, 'AI service returned no slides. Please try again.');
    }

    const existingSlides = await Slide.find({ deckId: deck._id }).select('_id');
    if (existingSlides.length > 0) {
        const existingSlideIds = existingSlides.map((slide) => slide._id);
        await SlideVersion.deleteMany({ slideId: { $in: existingSlideIds } });
        await Slide.deleteMany({ deckId: deck._id });
    }

    const slides = await Slide.insertMany(
        generated.slice(0, 10).map((slide, index) => ({
            deckId: deck._id,
            slideNumber: index + 1,
            title: String(slide.title || `Slide ${index + 1}`),
            content: Array.isArray(slide.content) ? slide.content.map(String) : [],
            speakerNotes: String(slide.speakerNotes || ''),
            layout: VALID_LAYOUTS.has(slide.layout) ? slide.layout : 'content'
        }))
    );

    deck.slideCount = slides.length;
    deck.status = 'ready';
    await deck.save();
    res.status(201).json({ slides });
}

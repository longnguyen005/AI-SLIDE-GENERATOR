import { getOwnedDeck } from './deck.controller.js';
import { Deck } from '../models/Deck.model.js';
import { Slide } from '../models/Slide.model.js';
import { SlideVersion } from '../models/SlideVersion.model.js';
import { regenerateSlide as regenerateWithAi } from '../services/gemini.service.js';
import { ApiError } from '../utils/ApiError.js';
import { routeParamObjectId } from '../utils/params.js';

const VALID_LAYOUTS = new Set(['title', 'content', 'two_column', 'section', 'summary']);

async function getOwnedSlide(slideId, userId) {
    const slide = await Slide.findById(slideId);
    if (!slide) {
        throw new ApiError(404, 'Slide not found');
    }
    await getOwnedDeck(slide.deckId.toString(), userId);
    return slide;
}

async function assignSlideNumbers(slideIds) {
    await Promise.all(slideIds.map((id, index) => Slide.updateOne({ _id: id }, { slideNumber: -(index + 1) })));
    await Promise.all(slideIds.map((id, index) => Slide.updateOne({ _id: id }, { slideNumber: index + 1 })));
}

async function renumber(deckId) {
    const slides = await Slide.find({ deckId }).sort({ slideNumber: 1, createdAt: 1 });
    await assignSlideNumbers(slides.map((slide) => slide._id));
    return slides.length;
}

async function nextSlideVersionNumber(slideId) {
    const latest = await SlideVersion.findOne({ slideId }).sort({ versionNumber: -1 }).select('versionNumber');
    return (latest?.versionNumber || 0) + 1;
}

export async function listSlides(req, res) {
    const deckId = routeParamObjectId(req.params.deckId, 'deckId');
    await getOwnedDeck(deckId, req.user.id);
    const slides = await Slide.find({ deckId }).sort({ slideNumber: 1 });
    res.json({ slides });
}

export async function createSlide(req, res) {
    const deck = await getOwnedDeck(routeParamObjectId(req.params.deckId, 'deckId'), req.user.id);
    const count = await Slide.countDocuments({ deckId: deck._id });
    if (count >= 10) {
        throw new ApiError(400, 'A deck can contain at most 10 slides');
    }

    const slide = await Slide.create({
        deckId: deck._id,
        slideNumber: count + 1,
        title: req.body.title?.trim() || 'Untitled slide',
        content: req.body.content || [],
        speakerNotes: req.body.speakerNotes || '',
        layout: req.body.layout || 'content'
    });

    deck.slideCount = count + 1;
    await deck.save();

    res.status(201).json({ slide });
}

export async function updateSlide(req, res) {
    const slide = await getOwnedSlide(routeParamObjectId(req.params.slideId, 'slideId'), req.user.id);
    ['title', 'content', 'speakerNotes', 'layout'].forEach((key) => {
        if (req.body[key] !== undefined) {
            slide.set(key, req.body[key]);
        }
    });
    await slide.save();
    res.json({ slide });
}

export async function deleteSlide(req, res) {
    const slide = await getOwnedSlide(routeParamObjectId(req.params.slideId, 'slideId'), req.user.id);
    const totalSlides = await Slide.countDocuments({ deckId: slide.deckId });
    if (totalSlides <= 1) {
        throw new ApiError(400, 'Cannot delete the last remaining slide in a deck');
    }

    const deckId = slide.deckId.toString();
    await SlideVersion.deleteMany({ slideId: slide._id });
    await slide.deleteOne();

    const remainingCount = await renumber(deckId);
    await Deck.findByIdAndUpdate(deckId, { slideCount: remainingCount });

    res.status(204).send();
}

export async function reorderSlides(req, res) {
    const deckId = routeParamObjectId(req.params.deckId, 'deckId');
    await getOwnedDeck(deckId, req.user.id);

    const slideIds = req.body.slideIds.map((id) => String(id).trim());
    const uniqueIds = new Set(slideIds);
    if (uniqueIds.size !== slideIds.length) {
        throw new ApiError(400, 'slideIds must not contain duplicate IDs');
    }

    const deckSlides = await Slide.find({ deckId }).select('_id');
    if (deckSlides.length !== slideIds.length) {
        throw new ApiError(400, 'slideIds must include every slide in the deck');
    }

    const deckSlideIdSet = new Set(deckSlides.map((slide) => slide._id.toString()));
    if (!slideIds.every((id) => deckSlideIdSet.has(id))) {
        throw new ApiError(400, 'All slide IDs must belong to this deck');
    }

    await assignSlideNumbers(slideIds);
    const updated = await Slide.find({ deckId }).sort({ slideNumber: 1 });
    res.json({ slides: updated });
}

export async function regenerateSlide(req, res) {
    const slide = await getOwnedSlide(routeParamObjectId(req.params.slideId, 'slideId'), req.user.id);
    const deck = await Deck.findById(slide.deckId);
    if (!deck) {
        throw new ApiError(404, 'Deck not found');
    }

    const neighbors = await Slide.find({ deckId: deck._id }).sort({ slideNumber: 1 });
    const index = neighbors.findIndex((item) => item._id.equals(slide._id));

    const previousSnapshot = {
        title: slide.title,
        content: [...slide.content],
        speakerNotes: slide.speakerNotes,
        layout: slide.layout
    };

    const regenerated = await regenerateWithAi({
        topic: deck.topic,
        language: deck.language,
        tone: deck.tone,
        previousTitle: neighbors[index - 1]?.title,
        nextTitle: neighbors[index + 1]?.title,
        instruction: req.body.instruction,
        currentSlide: previousSnapshot
    });

    const versionNumber = await nextSlideVersionNumber(slide._id);
    await SlideVersion.create({
        slideId: slide._id,
        ...previousSnapshot,
        versionNumber,
        reason: req.body.instruction || 'AI regeneration'
    });

    slide.title = regenerated.title || slide.title;
    slide.content = Array.isArray(regenerated.content) ? regenerated.content : slide.content;
    slide.speakerNotes = regenerated.speakerNotes || slide.speakerNotes;
    slide.layout = VALID_LAYOUTS.has(regenerated.layout) ? regenerated.layout : slide.layout;
    await slide.save();

    res.json({ slide });
}

export async function versions(req, res) {
    const slideId = routeParamObjectId(req.params.slideId, 'slideId');
    await getOwnedSlide(slideId, req.user.id);
    const slideVersions = await SlideVersion.find({ slideId }).sort({ versionNumber: -1 });
    res.json({ versions: slideVersions });
}

export async function restoreSlideVersion(req, res) {
    const slideId = routeParamObjectId(req.params.slideId, 'slideId');
    const versionId = routeParamObjectId(req.params.versionId, 'versionId');

    const slide = await getOwnedSlide(slideId, req.user.id);
    const targetVersion = await SlideVersion.findOne({ _id: versionId, slideId: slide._id });
    if (!targetVersion) {
        throw new ApiError(404, 'Slide version not found');
    }

    const versionNumber = await nextSlideVersionNumber(slide._id);
    await SlideVersion.create({
        slideId: slide._id,
        title: slide.title,
        content: [...slide.content],
        speakerNotes: slide.speakerNotes,
        layout: slide.layout,
        versionNumber,
        reason: `Before restoring version ${targetVersion.versionNumber}`
    });

    slide.title = targetVersion.title;
    slide.content = Array.isArray(targetVersion.content) ? [...targetVersion.content] : [];
    slide.speakerNotes = targetVersion.speakerNotes ?? '';
    if (targetVersion.layout && VALID_LAYOUTS.has(targetVersion.layout)) {
        slide.layout = targetVersion.layout;
    }
    await slide.save();

    res.json({ slide });
}

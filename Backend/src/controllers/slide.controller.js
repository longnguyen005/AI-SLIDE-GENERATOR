import { getOwnedDeck } from './deck.controller.js';
import { Deck } from '../models/Deck.model.js';
import { Slide } from '../models/Slide.model.js';
import { SlideVersion } from '../models/SlideVersion.model.js';
import { regenerateSlide as regenerateWithAi } from '../services/gemini.service.js';
import { ApiError } from '../utils/ApiError.js';
import { routeParam } from '../utils/params.js';
async function getOwnedSlide(slideId, userId) {
    const slide = await Slide.findById(slideId);
    if (!slide)
        throw new ApiError(404, 'Slide not found');
    await getOwnedDeck(slide.deckId.toString(), userId);
    return slide;
}
async function renumber(deckId) {
    const slides = await Slide.find({ deckId }).sort({ slideNumber: 1, createdAt: 1 });
    await Promise.all(slides.map((slide, index) => Slide.updateOne({ _id: slide._id }, { slideNumber: index + 1 })));
}
export async function listSlides(req, res) {
    const deckId = routeParam(req.params.deckId, 'deckId');
    await getOwnedDeck(deckId, req.user.id);
    const slides = await Slide.find({ deckId }).sort({ slideNumber: 1 });
    res.json({ slides });
}
export async function createSlide(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    const count = await Slide.countDocuments({ deckId: deck._id });
    if (count >= 10)
        throw new ApiError(400, 'A deck can contain at most 10 slides');
    const slide = await Slide.create({
        deckId: deck._id,
        slideNumber: count + 1,
        title: req.body.title || 'Untitled slide',
        content: req.body.content || [],
        speakerNotes: req.body.speakerNotes || '',
        layout: req.body.layout || 'content'
    });
    res.status(201).json({ slide });
}
export async function updateSlide(req, res) {
    const slide = await getOwnedSlide(routeParam(req.params.slideId, 'slideId'), req.user.id);
    ['title', 'content', 'speakerNotes', 'layout'].forEach((key) => {
        if (req.body[key] !== undefined)
            slide.set(key, req.body[key]);
    });
    await slide.save();
    res.json({ slide });
}
export async function deleteSlide(req, res) {
    const slide = await getOwnedSlide(routeParam(req.params.slideId, 'slideId'), req.user.id);
    const deckId = slide.deckId.toString();
    await slide.deleteOne();
    await renumber(deckId);
    res.status(204).send();
}
export async function reorderSlides(req, res) {
    const deckId = routeParam(req.params.deckId, 'deckId');
    await getOwnedDeck(deckId, req.user.id);
    const slideIds = req.body.slideIds.map(String);
    const slides = await Slide.find({ deckId, _id: { $in: slideIds } });
    if (slides.length !== slideIds.length)
        throw new ApiError(400, 'All slide IDs must belong to this deck');
    await Promise.all(slideIds.map((id, index) => Slide.updateOne({ _id: id }, { slideNumber: index + 1 })));
    const updated = await Slide.find({ deckId }).sort({ slideNumber: 1 });
    res.json({ slides: updated });
}
export async function regenerateSlide(req, res) {
    const slide = await getOwnedSlide(routeParam(req.params.slideId, 'slideId'), req.user.id);
    const deck = await Deck.findById(slide.deckId);
    if (!deck)
        throw new ApiError(404, 'Deck not found');
    const neighbors = await Slide.find({ deckId: deck._id }).sort({ slideNumber: 1 });
    const index = neighbors.findIndex((item) => item._id.equals(slide._id));
    const versionCount = await SlideVersion.countDocuments({ slideId: slide._id });
    await SlideVersion.create({
        slideId: slide._id,
        title: slide.title,
        content: slide.content,
        speakerNotes: slide.speakerNotes,
        layout: slide.layout,
        versionNumber: versionCount + 1,
        reason: req.body.instruction || 'AI regeneration'
    });
    const regenerated = await regenerateWithAi({
        topic: deck.topic,
        language: deck.language,
        tone: deck.tone,
        previousTitle: neighbors[index - 1]?.title,
        nextTitle: neighbors[index + 1]?.title,
        instruction: req.body.instruction,
        currentSlide: {
            title: slide.title,
            content: slide.content,
            speakerNotes: slide.speakerNotes,
            layout: slide.layout
        }
    });
    slide.title = regenerated.title || slide.title;
    slide.content = Array.isArray(regenerated.content) ? regenerated.content : slide.content;
    slide.speakerNotes = regenerated.speakerNotes || slide.speakerNotes;
    slide.layout = regenerated.layout || slide.layout;
    await slide.save();
    res.json({ slide });
}
export async function versions(req, res) {
    const slideId = routeParam(req.params.slideId, 'slideId');
    await getOwnedSlide(slideId, req.user.id);
    const slideVersions = await SlideVersion.find({ slideId }).sort({ versionNumber: -1 });
    res.json({ versions: slideVersions });
}

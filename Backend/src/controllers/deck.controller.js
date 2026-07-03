import { Deck } from '../models/Deck.model.js';
import { ExportHistory } from '../models/ExportHistory.model.js';
import { Slide } from '../models/Slide.model.js';
import { SlideVersion } from '../models/SlideVersion.model.js';
import { ApiError } from '../utils/ApiError.js';
import { routeParam } from '../utils/params.js';
export async function getOwnedDeck(deckId, userId) {
    const deck = await Deck.findOne({ _id: deckId, userId });
    if (!deck)
        throw new ApiError(404, 'Deck not found');
    return deck;
}
export async function listDecks(req, res) {
    const decks = await Deck.find({ userId: req.user?.id }).sort({ updatedAt: -1 });
    res.json({ decks });
}
export async function summary(req, res) {
    const userId = req.user?.id;
    const [totalDecks, totalExports, recentDecks] = await Promise.all([
        Deck.countDocuments({ userId }),
        ExportHistory.countDocuments({ userId }),
        Deck.find({ userId }).sort({ updatedAt: -1 }).limit(5)
    ]);
    res.json({ totalDecks, totalExports, recentDecks });
}
export async function getDeck(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    res.json({ deck });
}
export async function createDeck(req, res) {
    const deck = await Deck.create({
        userId: req.user?.id,
        title: req.body.title || req.body.topic,
        topic: req.body.topic,
        description: req.body.description || '',
        language: req.body.language || 'English',
        tone: req.body.tone,
        slideCount: Number(req.body.slideCount),
        status: 'draft'
    });
    res.status(201).json({ deck });
}
export async function updateDeck(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    const allowed = ['title', 'topic', 'description', 'language', 'tone'];
    allowed.forEach((key) => {
        if (req.body[key] !== undefined)
            deck.set(key, req.body[key]);
    });
    if (req.body.slideCount !== undefined)
        deck.slideCount = Number(req.body.slideCount);
    deck.status = 'draft';
    await deck.save();
    res.json({ deck });
}
export async function deleteDeck(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    const slides = await Slide.find({ deckId: deck._id }).select('_id');
    const slideIds = slides.map((slide) => slide._id);
    await SlideVersion.deleteMany({ slideId: { $in: slideIds } });
    await ExportHistory.deleteMany({ deckId: deck._id });
    await Slide.deleteMany({ deckId: deck._id });
    await deck.deleteOne();
    res.status(204).send();
}

import { getOwnedDeck } from './deck.controller.js';
import { ExportHistory } from '../models/ExportHistory.model.js';
import { Slide } from '../models/Slide.model.js';
import { buildPptx } from '../services/pptxExport.service.js';
import { ApiError } from '../utils/ApiError.js';
import { routeParam } from '../utils/params.js';
function fileSafe(value) {
    return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'deck';
}
export async function exportPptx(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    const slides = await Slide.find({ deckId: deck._id }).sort({ slideNumber: 1 });
    if (!slides.length)
        throw new ApiError(400, 'Deck has no slides to export');
    const buffer = await buildPptx({ title: deck.title, topic: deck.topic }, slides.map((slide) => ({
        title: slide.title,
        content: slide.content,
        speakerNotes: slide.speakerNotes,
        layout: slide.layout
    })));
    const fileName = `${fileSafe(deck.title)}-${Date.now()}.pptx`;
    await ExportHistory.create({
        deckId: deck._id,
        userId: req.user.id,
        format: 'pptx',
        fileName
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
}
export async function listExports(req, res) {
    const deck = await getOwnedDeck(routeParam(req.params.deckId, 'deckId'), req.user.id);
    const exports = await ExportHistory.find({ deckId: deck._id, userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ exports });
}

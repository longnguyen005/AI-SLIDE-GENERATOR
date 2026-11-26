import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    createDeck,
    deleteDeck,
    duplicateDeck,
    getDeck,
    listDecks,
    summary,
    updateDeck
} from '../controllers/deck.controller.js';
import { exportPptx, listExports } from '../controllers/export.controller.js';
import { generateDeckOutline, generateDeckSlides, getOutline, updateOutline } from '../controllers/outline.controller.js';
import { createSlide, listSlides, reorderSlides } from '../controllers/slide.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
    createDeckSchema,
    outlineSchema,
    reorderSchema,
    slideCreateSchema,
    updateDeckSchema
} from '../validators/schemas.js';

export const exportLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Export rate limit reached, please wait before trying again.' }
});

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(listDecks));
router.get('/stats/summary', asyncHandler(summary));
router.post('/', validateBody(createDeckSchema), asyncHandler(createDeck));
router.get('/:deckId', asyncHandler(getDeck));
router.post('/:deckId/duplicate', asyncHandler(duplicateDeck));
router.patch('/:deckId', validateBody(updateDeckSchema), asyncHandler(updateDeck));
router.delete('/:deckId', asyncHandler(deleteDeck));

router.post('/:deckId/outline/generate', asyncHandler(generateDeckOutline));
router.get('/:deckId/outline', asyncHandler(getOutline));
router.put('/:deckId/outline', validateBody(outlineSchema), asyncHandler(updateOutline));

router.post('/:deckId/slides/generate', asyncHandler(generateDeckSlides));
router.get('/:deckId/slides', asyncHandler(listSlides));
router.post('/:deckId/slides', validateBody(slideCreateSchema), asyncHandler(createSlide));
router.patch('/:deckId/slides/reorder', validateBody(reorderSchema), asyncHandler(reorderSlides));

router.post('/:deckId/export/pptx', exportLimit, asyncHandler(exportPptx));
router.get('/:deckId/exports', asyncHandler(listExports));

export default router;

import { Router } from 'express';
import { deleteSlide, regenerateSlide, updateSlide, versions } from '../controllers/slide.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { regenerateSchema, slideUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.use(authMiddleware);

router.patch('/:slideId', validateBody(slideUpdateSchema), asyncHandler(updateSlide));
router.delete('/:slideId', asyncHandler(deleteSlide));
router.post('/:slideId/regenerate', validateBody(regenerateSchema), asyncHandler(regenerateSlide));
router.get('/:slideId/versions', asyncHandler(versions));

export default router;

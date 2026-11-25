import { Router } from 'express';
import { demoLogin, login, logout, me, register } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(register));
router.post('/login', validateBody(loginSchema), asyncHandler(login));
router.post('/demo', asyncHandler(demoLogin));
router.post('/logout', authMiddleware, asyncHandler(logout));
router.get('/me', authMiddleware, asyncHandler(me));

export default router;

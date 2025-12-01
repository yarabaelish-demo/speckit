import { Router } from 'express';
import authRouter from './auth.js';
import audioRouter from './audio.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/audio', audioRouter);

export default router;
import { Router } from 'express';
import authRouter from '#api/auth';
import audioRouter from '#api/audio';

const router = Router();

router.use('/auth', authRouter);
router.use('/audio', audioRouter);

export default router;
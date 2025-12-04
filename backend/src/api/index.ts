import { Router } from 'express';
import authRouter from '#api/auth';
import { router as audioRouter } from '#api/audio';

const router = Router();

router.use('/auth', authRouter);
router.use('/audio', audioRouter);

export default router;
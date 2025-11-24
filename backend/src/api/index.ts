import { Router } from 'express';
import audioRouter from './audio.js';
import authRouter from './auth.js';

const apiRouter = Router();

apiRouter.use('/audio', audioRouter);
apiRouter.use('/auth', authRouter);

export default apiRouter;

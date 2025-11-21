import { Router } from 'express';
import audioRouter from './audio';

const apiRouter = Router();

apiRouter.use('/audio', audioRouter);

export default apiRouter;

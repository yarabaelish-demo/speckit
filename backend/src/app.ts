import express from 'express';
import cors from 'cors';
import apiRouter from './api/index.js';
import { logger, errorLogger } from './middleware/logger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger); // Use request logger
app.use('/api', apiRouter);
app.use(errorLogger); // Use error logger

export default app;

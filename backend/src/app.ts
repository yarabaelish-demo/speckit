import express from 'express';
import cors from 'cors';
import apiRouter from './api';
import { logger, errorLogger } from './middleware/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger); // Use request logger
app.use('/api', apiRouter);
app.use(errorLogger); // Use error logger

export default app;

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import api from '#api/index';
import { logger } from '#middleware/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', api);

app.use(logger);

export default app;
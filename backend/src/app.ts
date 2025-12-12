import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import api from '#api/index';
import { errorHandler } from '#middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', api);

app.use(errorHandler);

export default app;
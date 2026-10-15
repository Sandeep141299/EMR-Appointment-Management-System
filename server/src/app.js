import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRouter from './routes/authRoutes.js';
import appointmentRouter from './routes/appointmentRoutes.js';
import healthRouter from './routes/healthRoutes.js';
import patientRouter from './routes/patientRoutes.js';
import staffRouter, { adminRouter } from './routes/staffRoutes.js';
import slotRouter from './routes/slotRoutes.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientUrls.includes(origin)) {
      return callback(null, true);
    }
    return callback(new AppError('Origin is not allowed by CORS', 403));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    data: null,
    meta: null,
  },
}));

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', appointmentRouter);
app.use('/api/v1', patientRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', staffRouter);
app.use('/api/v1', slotRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

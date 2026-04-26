import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import borrowerRoutes from './routes/borrowerRoutes';
import loanRoutes from './routes/loanRoutes';
import salesRoutes from './routes/salesRoutes';
import sanctionRoutes from './routes/sanctionRoutes';
import disbursementRoutes from './routes/disbursementRoutes';
import collectionRoutes from './routes/collectionRoutes';
import { errorHandler } from './middleware/error';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/borrower', borrowerRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/sanction', sanctionRoutes);
  app.use('/api/disbursement', disbursementRoutes);
  app.use('/api/collection', collectionRoutes);

  app.use(errorHandler);
  return app;
}

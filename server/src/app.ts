import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './middleware/auth.js';
import { attachFamilyInfo, requireFamily } from './middleware/familyAuth.js';
import authRoutes from './routes/auth.js';
import familyRoutes from './routes/families.js';
import childrenRoutes from './routes/children.js';
import tasksRoutes from './routes/tasks.js';
import rewardsRoutes from './routes/rewards.js';
import activityRoutes from './routes/activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/families', authenticateToken, attachFamilyInfo, familyRoutes);
  app.use(
    '/api/children',
    authenticateToken,
    attachFamilyInfo,
    requireFamily,
    childrenRoutes
  );
  app.use(
    '/api/tasks',
    authenticateToken,
    attachFamilyInfo,
    requireFamily,
    tasksRoutes
  );
  app.use(
    '/api/rewards',
    authenticateToken,
    attachFamilyInfo,
    requireFamily,
    rewardsRoutes
  );
  app.use(
    '/api/children',
    authenticateToken,
    attachFamilyInfo,
    requireFamily,
    activityRoutes
  );

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Serve static files in production
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  // SPA fallback - serve index.html for non-API routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
};

import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { authenticateToken } from './middleware/auth.js';
import { attachFamilyInfo, requireFamily } from './middleware/familyAuth.js';
import authRoutes from './routes/auth.js';
import familyRoutes from './routes/families.js';
import childrenRoutes from './routes/children.js';
import tasksRoutes from './routes/tasks.js';
import rewardsRoutes from './routes/rewards.js';
import activityRoutes from './routes/activity.js';
import uploadRoutes from './routes/uploads.js';
import kioskRoutes from './routes/kiosk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAppVersion(): string {
  if (process.env.APP_VERSION && process.env.APP_VERSION !== 'unknown') {
    return process.env.APP_VERSION;
  }
  try {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

const APP_VERSION = getAppVersion();

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
  app.use('/api/uploads', authenticateToken, attachFamilyInfo, uploadRoutes);
  app.use('/api/kiosk', kioskRoutes);

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', version: APP_VERSION });
  });

  // Serve static files in production
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  // SPA fallback - serve index.html for non-API routes
  app.get('/{*splat}', (req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  return app;
};

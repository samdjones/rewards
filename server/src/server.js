import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/init.js';
import { authenticateToken } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import childrenRoutes from './routes/children.js';
import tasksRoutes from './routes/tasks.js';
import rewardsRoutes from './routes/rewards.js';
import activityRoutes from './routes/activity.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/children', authenticateToken, childrenRoutes);
app.use('/api/tasks', authenticateToken, tasksRoutes);
app.use('/api/rewards', authenticateToken, rewardsRoutes);
app.use('/api/children', authenticateToken, activityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

await initDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

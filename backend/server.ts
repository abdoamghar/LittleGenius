import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './db/connect.js';

import teacherRoutes from './Routes/teacherRoutes.js';
import studentRoutes from './Routes/studentRoutes.js';
import courseRoutes from './Routes/courseRoutes.js';
import chapterRoutes from './Routes/chapterRoutes.js';
import activityRoutes from './Routes/activityRoutes.js';
import classRoutes from './Routes/classRoutes.js';
import sectionRoutes from './Routes/sectionRoutes.js';
import aiRoutes from './Routes/aiRoutes.js';
import authRoutes from './Routes/authRoutes.js';

const app = express();
const PORT = Number(process.env.PORT || process.env.API_PORT || 5000);

const configuredFrontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((value) => {
    try {
      return new URL(value.trim()).origin;
    } catch {
      return '';
    }
  })
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    const localDevelopmentOrigin = Boolean(origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
    if (!origin || configuredFrontendOrigins.includes(origin) || localDevelopmentOrigin) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());


app.get('/', (_req, res) => {
  res.status(200).json({ message: 'LittleGenius API is running!' });
});

app.use('/api', async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/ai', aiRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', error);
  const statusCode = (error as any).statusCode || (error.name === 'MongooseServerSelectionError' ? 503 : 500);
  const message = statusCode === 503 ? 'Database is unavailable. Check the backend database connection.' : 'Internal server error.';
  res.status(statusCode).json({ message });
});

export default app;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log('LittleGenius API is running on port ' + PORT);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer().catch((error) => {
    console.error('Unable to start LittleGenius API:', error);
    process.exitCode = 1;
  });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import videoRoutes from '@/routes/video';
import searchRoutes from '@/routes/search';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { config } from '@/config';

const app: express.Application = express();


app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production' ? ['https://yourdomain.com'] : true,
  credentials: true,
}));


app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});


app.use('/api/videos', videoRoutes);
app.use('/api/search', searchRoutes);


app.get('/api', (req, res) => {
  res.json({
    name: 'YouTube Video Aggregator API',
    version: '1.0.0',
    endpoints: {
      videos: {
        'GET /api/videos': 'Get paginated list of videos',
        'GET /api/videos/:id': 'Get specific video by ID',
      },
      search: {
        'POST /api/search': 'Search videos by title and description',
      },
      system: {
        'GET /health': 'Health check endpoint',
        'GET /api': 'This documentation',
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});


app.use(notFoundHandler);
app.use(errorHandler);

export { app };

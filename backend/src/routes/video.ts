import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { validateRequest } from '@/middleware/validation';
import { VideoListResponse } from '@/types';

const router:Router = Router();

const videoQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  sortBy: z.enum(['publishedAt', 'title', 'viewCount']).optional().default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  channelId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const videoParamsSchema = z.object({
  id: z.string().min(1),
});


router.get('/', validateRequest({ query: videoQuerySchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sortBy, sortOrder, channelId, dateFrom, dateTo } = (req as any).validatedQuery;
    
   console.log("Data parse from request ",page, limit, sortBy, sortOrder, channelId, dateFrom, dateTo);
    const where: any = {};
    if (channelId) {
      where.channelId = channelId;
    }
    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) where.publishedAt.gte = new Date(dateFrom);
      if (dateTo) where.publishedAt.lte = new Date(dateTo);
    }


    const skip = (page - 1) * limit;
    
    
    const totalCount = await prisma.video.count({ where });
    
    
    const videos = await prisma.video.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      select: {
        id: true,
        videoId: true,
        videoUrl: true,
        title: true,
        description: true,
        publishedAt: true,
        channelTitle: true,
        channelId: true,
        thumbnails: true,
        duration: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
      },
    });


    const totalPages = Math.ceil(totalCount / limit);
    const response: VideoListResponse = {
      videos: videos.map(video => ({
        videoId: video.videoId,
        title: video.title,
        videoUrl: video.videoUrl,
        description: video.description,
        publishedAt: video.publishedAt.toISOString(),
        channelTitle: video.channelTitle,
        channelId: video.channelId,
        thumbnails: video.thumbnails as any,
        duration: video.duration || undefined,
        viewCount: video.viewCount?.toString(),
        likeCount: video.likeCount?.toString(),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    res.json({
      status: 'success',
      data: response,
    });
  } catch (error) {
    next(error);
  }
});


router.get('/:id', validateRequest({ params: videoParamsSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const video = await prisma.video.findFirst({
      where: {
        OR: [
          { id },
          { videoId: id },
        ],
      },
    });

    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found',
      });
    }

    return res.json({
      status: 'success',
      data: {
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt.toISOString(),
        channelTitle: video.channelTitle,
        channelId: video.channelId,
        thumbnails: video.thumbnails,
        duration: video.duration,
        viewCount: video.viewCount?.toString(),
        likeCount: video.likeCount?.toString(),
        createdAt: video.createdAt.toISOString(),
        updatedAt: video.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});


router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalVideos, totalChannels, latestVideo, oldestVideo] = await Promise.all([
      prisma.video.count(),
      prisma.video.groupBy({
        by: ['channelId'],
        _count: true,
      }),
      prisma.video.findFirst({
        orderBy: { publishedAt: 'desc' },
        select: { publishedAt: true },
      }),
      prisma.video.findFirst({
        orderBy: { publishedAt: 'asc' },
        select: { publishedAt: true },
      }),
    ]);

    res.json({
      status: 'success',
      data: {
        totalVideos,
        totalChannels: totalChannels.length,
        dateRange: {
          latest: latestVideo?.publishedAt?.toISOString(),
          oldest: oldestVideo?.publishedAt?.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
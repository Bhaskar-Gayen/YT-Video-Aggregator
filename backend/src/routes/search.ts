import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { validateRequest } from '@/middleware/validation';
import { VideoListResponse, SearchParams } from '@/types';

const router:Router = Router();


const searchSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'publishedAt', 'viewCount']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});


router.post('/', validateRequest({ body: searchSchema }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, page, limit, sortBy, sortOrder } = req.body as z.infer<typeof searchSchema>;
    
    console.log("query parse ",query, page, limit, sortBy, sortOrder);

    const skip = (page - 1) * limit;
    
   
    const searchTerms = query.trim().toLowerCase().split(/\s+/);
    
    
    const searchConditions = searchTerms.map(term => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
        { channelTitle: { contains: term, mode: 'insensitive' as const } },
      ],
    }));

   
    const whereCondition = {
      AND: searchConditions,
    };

   
    const totalCount = await prisma.video.count({
      where: whereCondition,
    });

    
    let orderBy: any = {};
    if (sortBy === 'relevance') {
      orderBy = { publishedAt: 'desc' };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    
    const videos = await prisma.video.findMany({
      where: whereCondition,
      orderBy,
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
      },
    });

    
    const totalPages = Math.ceil(totalCount / limit);
    const response: VideoListResponse = {
      videos: videos.map(video => ({
        videoId: video.videoId,
        title: video.title,
        videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
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
      meta: {
        searchQuery: query,
        searchTerms: searchTerms.length,
        totalMatches: totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
});


router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Query parameter "q" is required',
      });
    }

    
    const suggestions = await prisma.video.findMany({
      where: {
        title: {
          contains: q,
          mode: 'insensitive',
        },
      },
      select: {
        title: true,
      },
      take: 10,
      orderBy: {
        viewCount: 'desc',
      },
    });

   
    const words = new Set<string>();
    suggestions.forEach(video => {
      const titleWords = video.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.includes(q.toLowerCase()) && word.length > 2) {
          words.add(word);
        }
      });
    });

    return res.json({
      status: 'success',
      data: {
        suggestions: Array.from(words).slice(0, 5),
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
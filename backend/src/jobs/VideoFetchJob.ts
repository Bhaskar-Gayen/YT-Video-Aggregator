import { Job, Queue, Worker } from 'bullmq';
import { config } from '@/config';
import YouTubeService from '@/services/YTService';
import { prisma } from '../config/database';
import { YouTubeVideo } from '@/types';
import { duration } from 'zod/v4/classic/iso.cjs';

const QUEUE_NAME = 'youtube-video';

// Create queue
export const videoFetchQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// YouTube service instance
const youtubeService = new YouTubeService(config.youtube.apiKeys);

// worker task kind of consumer
const processVideoFetch = async (job: Job) => {
  try {
    console.log('Fetching latest videos...');
    
    const videos = await youtubeService.searchVideos(config.youtube.searchQuery);
    const videoIds = videos.map(v => v.id.videoId).filter(Boolean);

    const detailedVideos = await youtubeService.getVideoDetails(videoIds);

    let savedCount = 0;

    for (const video of detailedVideos) {
      try {
        const videoData = {
          videoId: video.id,
          title: video.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          description: video.snippet.description,
          publishedAt: new Date(video.snippet.publishedAt),
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          thumbnails: video.snippet.thumbnails,
          viewCount: video.statistics?.viewCount || 0,
          likeCount: video.statistics?.likeCount || 0,
          duration: video.statistics?.duration || 0,
          commentCount: video.statistics?.commentCount || 0,
        };

        await prisma.video.upsert({
          where: { videoId: videoData.videoId },
          update: videoData,
          create: videoData,
        });

        savedCount++;
      } catch (error) {
        console.error(`Error saving video ${video.id.videoId}:`, error);
      }
    }

    console.log(`Successfully processed ${savedCount} videos`);
    return { processedCount: savedCount };
  } catch (error) {
    console.error('Video fetch job failed:', error);
    throw error;
  }
};

// Create worker
export const videoFetchWorker = new Worker(QUEUE_NAME, processVideoFetch, {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

// Add recurring job
export const startVideoFetching = async () => {
  const res= await videoFetchQueue.add(
    'fetch-videos',
    {},
    {
      repeat: { every: config.youtube.fetchInterval },
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  );
  
  console.log(`Started video fetching every ${config.youtube.fetchInterval}ms`);
};

startVideoFetching().catch(console.error);
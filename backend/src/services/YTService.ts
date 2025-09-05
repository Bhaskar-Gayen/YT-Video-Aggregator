import { google, youtube_v3 } from 'googleapis';
import { prisma } from '@/config/database';

class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private apiKeys: string[];
  private currentKeyIndex = 0;

  constructor(apiKeys: string[]) {
    this.apiKeys = apiKeys;
    this.youtube = google.youtube({ version: 'v3' });
  }

  private async getActiveApiKey(): Promise<string> {
    
    const apiKey = this.apiKeys[this.currentKeyIndex];
    
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyValue: apiKey }
    });

    if(!keyRecord) {
      
      await prisma.apiKey.create({
        data: { keyValue: apiKey ||''}
      });
    } else if (keyRecord.quotaUsed >= keyRecord.quotaLimit) {
      
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      return this.getActiveApiKey();
    }

    return apiKey as string;
  }

  async searchVideos(query: string, publishedAfter?: string): Promise<any[]> {
    let attempts = 0;
  
    while (attempts < this.apiKeys.length) {
      try {
        const apiKey = await this.getActiveApiKey();
  
        const response = await this.youtube.search.list({
          key: apiKey,
          part: ['snippet'],
          type: ['video'],
          order: 'date',
          maxResults: 50,
          q: query,
          publishedAfter: publishedAfter || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        });
  
        
        await this.updateQuotaUsage(apiKey as string, 100);
  
        return response.data.items || [];
  
      } catch (error: any) {
        console.error('YouTube API Error:', error?.response?.data?.error || error);

        const errors = error?.response?.data?.error?.errors;
        const isQuotaExceeded = errors?.some((e: any) => e.reason === 'quotaExceeded');
  
        if (isQuotaExceeded) {
          console.log(`Quota exceeded for key ${this.apiKeys[this.currentKeyIndex]}, switching...`);
          this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
          attempts++;
          continue; 
        }
  
        throw error; 
      }
    }
  
    throw new Error('All API keys exhausted due to quota limits.');
  }
  

  private async updateQuotaUsage(apiKey: string, cost: number): Promise<void> {
    await prisma.apiKey.update({
      where: { keyValue: apiKey },
      data: {
        quotaUsed: {
          increment: cost
        }
      }
    });
  }

  async getVideoDetails(videoIds: string[]): Promise<any[]> {
    try {
      const apiKey = await this.getActiveApiKey();
    
    const response = await this.youtube.videos.list({
      key: apiKey,
      part: ['snippet','statistics'],
      id: videoIds,
    });

    await this.updateQuotaUsage(apiKey, 1); 

    return response.data.items || [];
    } catch (error) {
      console.error('YouTube API Error:', error);
      throw error;
    }
  }
}

export default YouTubeService;
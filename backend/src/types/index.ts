export interface YouTubeVideo {
    videoId: string;
    title: string;
    videoUrl: string;
    description: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
    duration?: number;
    viewCount?: string;
    likeCount?: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
  }
  
  export interface SearchParams extends PaginationParams {
    query: string;
  }
  
  export interface VideoListResponse {
    videos: YouTubeVideo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }

  export interface ApiKeyRecord {
    keyValue: string;
    quotaUsed?: number;
    quotaLimit?: number;
  }
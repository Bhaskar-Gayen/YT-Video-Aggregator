"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Play,
  Eye,
  Calendar,
  Clock,
  Users,
  ThumbsUp,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Menu,
  Bell,
  Video,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp
} from "lucide-react"

// Types
interface VideoData {
  videoId: string;
  title: string;
  videoUrl?: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  thumbnails: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
  };
  duration?: string;
  viewCount?: string;
  likeCount?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  status: string;
  data: {
    videos: VideoData[];
    pagination: PaginationData;
  };
}

interface SearchResponse extends ApiResponse {
  meta: {
    searchQuery: string;
    searchTerms: number;
    totalMatches: number;
  };
}

interface ThemeClasses {
  bg: string;
  headerBg: string;
  cardBg: string;
  border: string;
  text: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  hoverBg: string;
  tableBg: string;
  tableHover: string;
  modalBg: string;
  statBg: string;
}

// Utility functions
const formatViews = (views: string | number | undefined): string => {
  if (!views) return "0";
  const numViews = typeof views === 'string' ? parseInt(views) : views;
  if (numViews >= 1000000) return `${(numViews / 1000000).toFixed(1)}M`;
  if (numViews >= 1000) return `${(numViews / 1000).toFixed(1)}K`;
  return numViews.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};

const getYouTubeUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

const getThumbnail = (thumbnails: VideoData['thumbnails']): string => {
  return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '/placeholder.svg';
};

const getThemeClasses = (isDarkMode: boolean): ThemeClasses => ({
  bg: isDarkMode ? "bg-zinc-950" : "bg-gray-50",
  headerBg: isDarkMode ? "bg-zinc-900" : "bg-white",
  cardBg: isDarkMode ? "bg-zinc-900" : "bg-white",
  border: isDarkMode ? "border-zinc-800" : "border-gray-200",
  text: isDarkMode ? "text-white" : "text-gray-900",
  textSecondary: isDarkMode ? "text-zinc-300" : "text-gray-700",
  inputBg: isDarkMode ? "bg-zinc-800" : "bg-gray-100",
  inputBorder: isDarkMode ? "border-zinc-700" : "border-gray-300",
  hoverBg: isDarkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100",
  tableBg: isDarkMode ? "bg-zinc-800/50" : "bg-gray-50",
  tableHover: isDarkMode ? "hover:bg-zinc-800/30" : "hover:bg-gray-100",
  modalBg: isDarkMode ? "bg-zinc-900" : "bg-white",
  statBg: isDarkMode ? "bg-zinc-800" : "bg-gray-100",
});

// Stats Card Component
interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
  themeClasses: ThemeClasses;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  icon, 
  title, 
  value, 
  bgColor, 
  iconColor, 
  themeClasses 
}) => (
  <Card className={`${themeClasses.cardBg} ${themeClasses.border} transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] cursor-pointer group`}>
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className={`${bgColor} p-2 sm:p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
          <div className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm sm:text-base ${themeClasses.textSecondary} group-hover:${themeClasses.text} transition-colors duration-300`}>
            {title}
          </p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${themeClasses.text} group-hover:scale-105 transition-transform duration-300`}>
            {value}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Header Component
interface HeaderProps {
  themeClasses: ThemeClasses;
  isDarkMode: boolean;
  searchQuery: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
  themeClasses,
  isDarkMode,
  searchQuery,
  loading,
  onSearchChange,
  onRefresh,
  onToggleTheme
}) => (
  <header className={`${themeClasses.headerBg} ${themeClasses.border} border-b sticky top-0 z-50 shadow-sm`}>
    <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">
      {/* Left Section - Menu and Logo */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
        <Button variant="ghost" size="sm" className={`${themeClasses.text} ${themeClasses.hoverBg} p-2`}>
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 sm:p-2 rounded">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 text-white fill-white" />
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-lg sm:text-xl font-semibold">YouTube</span>
            <span className={`text-xs ${themeClasses.textSecondary} ml-1`}>Analytics</span>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-2 sm:mx-4 lg:mx-8">
        <div className="flex items-center">
          <div className="relative flex-1">
            <Input
              placeholder="Search videos..."
              className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} placeholder:${themeClasses.textSecondary} rounded-l-full rounded-r-none border-r-0 pl-3 sm:pl-4 h-8 sm:h-10 focus:border-blue-500 text-sm sm:text-base`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Button
            className={`${isDarkMode ? "bg-zinc-700 hover:bg-zinc-600 border-zinc-700" : "bg-gray-200 hover:bg-gray-300 border-gray-300"} border rounded-r-full rounded-l-none h-8 sm:h-10 px-3 sm:px-6`}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Search className="h-3 w-3 sm:h-4 sm:w-4" />}
          </Button>
        </div>
      </div>

      {/* Right Section - Actions and Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className={`${themeClasses.text} ${themeClasses.hoverBg} p-2`}
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`${themeClasses.text} ${themeClasses.hoverBg} p-2`}
          onClick={onToggleTheme}
        >
          {isDarkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
          <AvatarFallback className="bg-red-600 text-white text-xs">YT</AvatarFallback>
        </Avatar>
      </div>
    </div>
  </header>
);

// Filters Component
interface FiltersProps {
  themeClasses: ThemeClasses;
  sortBy: string;
  sortOrder: string;
  filterChannel: string;
  itemsPerPage: number;
  uniqueChannels: string[];
  onSortChange: (value: string) => void;
  onSortOrderChange: (value: string) => void;
  onChannelFilterChange: (value: string) => void;
  onItemsPerPageChange: (value: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  themeClasses,
  sortBy,
  sortOrder,
  filterChannel,
  itemsPerPage,
  uniqueChannels,
  onSortChange,
  onSortOrderChange,
  onChannelFilterChange,
  onItemsPerPageChange
}) => (
  <div className={`${themeClasses.border} border-t px-3 sm:px-4 lg:px-6 py-3`}>
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className={`w-32 sm:w-40 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} text-sm`}>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className={`${themeClasses.cardBg} ${themeClasses.border}`}>
            <SelectItem value="publishedAt" className={themeClasses.text}>Published Date</SelectItem>
            <SelectItem value="title" className={themeClasses.text}>Title</SelectItem>
            <SelectItem value="viewCount" className={themeClasses.text}>View Count</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger className={`w-24 sm:w-32 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} text-sm`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={`${themeClasses.cardBg} ${themeClasses.border}`}>
            <SelectItem value="desc" className={themeClasses.text}>Desc</SelectItem>
            <SelectItem value="asc" className={themeClasses.text}>Asc</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterChannel} onValueChange={onChannelFilterChange}>
          <SelectTrigger className={`w-36 sm:w-48 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} text-sm`}>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent className={`${themeClasses.cardBg} ${themeClasses.border}`}>
            <SelectItem value="all" className={themeClasses.text}>All Channels</SelectItem>
            {uniqueChannels.map((channel) => (
              <SelectItem key={channel} value={channel} className={themeClasses.text}>
                {channel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items per page */}
      <div className="flex items-center gap-2 ml-auto">
        <span className={`text-sm ${themeClasses.textSecondary} hidden sm:inline`}>Show</span>
        <Select value={itemsPerPage.toString()} onValueChange={onItemsPerPageChange}>
          <SelectTrigger className={`w-16 sm:w-20 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} text-sm`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={`${themeClasses.cardBg} ${themeClasses.border}`}>
            <SelectItem value="5" className={themeClasses.text}>5</SelectItem>
            <SelectItem value="10" className={themeClasses.text}>10</SelectItem>
            <SelectItem value="20" className={themeClasses.text}>20</SelectItem>
            <SelectItem value="50" className={themeClasses.text}>50</SelectItem>
          </SelectContent>
        </Select>
        <span className={`text-sm ${themeClasses.textSecondary} hidden sm:inline`}>per page</span>
      </div>
    </div>
  </div>
);

// Video Table Component
interface VideoTableProps {
  videos: VideoData[];
  loading: boolean;
  error: string | null;
  themeClasses: ThemeClasses;
  onVideoClick: (video: VideoData) => void;
  onRefresh: () => void;
}

const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  loading,
  error,
  themeClasses,
  onVideoClick,
  onRefresh
}) => (
  <Card className={`${themeClasses.cardBg} ${themeClasses.border}`}>
    <CardContent className="p-0">
      {/* Mobile Card View */}
      <div className="block sm:hidden">
        {loading ? (
          <div className={`p-8 text-center ${themeClasses.textSecondary}`}>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading videos...
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Failed to load videos</p>
                <p className="text-sm opacity-75">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                className="ml-auto"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-4 p-4">
            {videos.map((video) => (
              <div
                key={video.videoId}
                className={`${themeClasses.border} border rounded-lg p-4 ${themeClasses.hoverBg} cursor-pointer transition-colors`}
                onClick={() => onVideoClick(video)}
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={getThumbnail(video.thumbnails)}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {video.duration && (
                      <Badge className="absolute -bottom-1 -right-1 text-xs bg-black/90 text-white">
                        {video.duration}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${themeClasses.text} line-clamp-2 text-sm mb-2`}>
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {video.channelTitle.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`text-xs ${themeClasses.textSecondary} truncate`}>
                        {video.channelTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{formatViews(video.viewCount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 text-center ${themeClasses.textSecondary}`}>
            No videos found matching your criteria
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`${themeClasses.border} border-b ${themeClasses.tableBg}`}>
              <th className={`text-left p-4 font-medium ${themeClasses.textSecondary}`}>Video</th>
              <th className={`text-left p-4 font-medium ${themeClasses.textSecondary}`}>Channel</th>
              <th className={`text-left p-4 font-medium ${themeClasses.textSecondary}`}>Views</th>
              <th className={`text-left p-4 font-medium ${themeClasses.textSecondary}`}>Published</th>
              <th className={`text-left p-4 font-medium ${themeClasses.textSecondary}`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={`p-8 text-center ${themeClasses.textSecondary}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading videos...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Failed to load videos</p>
                      <p className="text-sm opacity-75">{error}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onRefresh}
                      className="ml-auto"
                    >
                      Try Again
                    </Button>
                  </div>
                </td>
              </tr>
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <tr
                  key={video.videoId}
                  className={`${themeClasses.border} border-b ${themeClasses.tableHover} cursor-pointer transition-colors`}
                  onClick={() => onVideoClick(video)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getThumbnail(video.thumbnails)}
                          alt={video.title}
                          className="w-24 sm:w-32 h-16 sm:h-20 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        {video.duration && (
                          <Badge
                            variant="secondary"
                            className="absolute bottom-1 right-1 text-xs bg-black/90 text-white hover:bg-black/90 px-1.5 py-0.5"
                          >
                            {video.duration}
                          </Badge>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-medium ${themeClasses.text} line-clamp-2 text-balance leading-5 text-sm sm:text-base`}>
                          {video.title}
                        </h3>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {video.channelTitle.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`text-sm font-medium ${themeClasses.textSecondary} truncate max-w-[100px] lg:max-w-[150px]`}>
                        {video.channelTitle}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-sm ${themeClasses.textSecondary}`}>
                      <Eye className="h-4 w-4" />
                      <span>{formatViews(video.viewCount)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-sm ${themeClasses.textSecondary}`}>
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getYouTubeUrl(video.videoId), '_blank');
                      }}
                      className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={`p-8 text-center ${themeClasses.textSecondary}`}>
                  No videos found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

// Pagination Component
interface PaginationProps {
  pagination: PaginationData;
  loading: boolean;
  themeClasses: ThemeClasses;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  loading,
  themeClasses,
  currentPage,
  onPageChange
}) => {
  if (pagination.totalPages <= 1 || loading) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={!pagination.hasPrev || loading}
        className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg}`}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
          let pageNum;
          if (pagination.totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= pagination.totalPages - 2) {
            pageNum = pagination.totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }

          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              className={`w-8 sm:w-10 ${
                currentPage === pageNum
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : `${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg}`
              }`}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(currentPage + 1, pagination.totalPages))}
        disabled={!pagination.hasNext || loading}
        className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg}`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

// Video Detail Modal Component
interface VideoDetailModalProps {
  video: VideoData | null;
  isOpen: boolean;
  onClose: () => void;
  themeClasses: ThemeClasses;
  isDarkMode: boolean;
}

const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  video,
  isOpen,
  onClose,
  themeClasses,
  isDarkMode
}) => {
  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto ${themeClasses.modalBg} ${themeClasses.border} ${themeClasses.text} mx-4`}>
        <DialogHeader>
          <DialogTitle className={`text-lg sm:text-xl font-bold ${themeClasses.text} text-balance pr-8 leading-tight`}>
            {video.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Video Preview */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={getThumbnail(video.thumbnails)}
                alt={video.title}
                className="w-full aspect-video object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              {video.duration && (
                <Badge
                  variant="secondary"
                  className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-xs bg-black/90 text-white hover:bg-black/90 px-1.5 py-0.5"
                >
                  {video.duration}
                </Badge>
              )}
            </div>

            {/* Channel Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarFallback className={`${isDarkMode ? "bg-zinc-700" : "bg-gray-300"} ${themeClasses.text}`}>
                  {video.channelTitle.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold ${themeClasses.text} text-sm sm:text-base`}>{video.channelTitle}</h3>
                <p className={`text-xs sm:text-sm ${themeClasses.textSecondary} truncate`}>
                  Channel ID: {video.channelId}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Video Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Video Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`text-center p-2 sm:p-3 ${themeClasses.statBg} rounded-lg hover:scale-105 transition-transform duration-200`}>
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-blue-500" />
                <p className={`text-xs ${themeClasses.textSecondary}`}>Views</p>
                <p className={`text-sm sm:text-base font-semibold ${themeClasses.text}`}>
                  {video.viewCount ? formatViews(video.viewCount) : "N/A"}
                </p>
              </div>
              <div className={`text-center p-2 sm:p-3 ${themeClasses.statBg} rounded-lg hover:scale-105 transition-transform duration-200`}>
                <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-green-500" />
                <p className={`text-xs ${themeClasses.textSecondary}`}>Likes</p>
                <p className={`text-sm sm:text-base font-semibold ${themeClasses.text}`}>
                  {video.likeCount ? formatViews(video.likeCount) : "N/A"}
                </p>
              </div>
              <div className={`text-center p-2 sm:p-3 ${themeClasses.statBg} rounded-lg hover:scale-105 transition-transform duration-200`}>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-purple-500" />
                <p className={`text-xs ${themeClasses.textSecondary}`}>Published</p>
                <p className={`text-sm sm:text-base font-semibold ${themeClasses.text}`}>{formatDate(video.publishedAt)}</p>
              </div>
              <div className={`text-center p-2 sm:p-3 ${themeClasses.statBg} rounded-lg hover:scale-105 transition-transform duration-200`}>
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-orange-500" />
                <p className={`text-xs ${themeClasses.textSecondary}`}>Duration</p>
                <p className={`text-sm sm:text-base font-semibold ${themeClasses.text}`}>
                  {video.duration || "N/A"}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className={`font-semibold mb-2 ${themeClasses.text} text-sm sm:text-base`}>Description</h4>
              <div className={`max-h-24 sm:max-h-32 overflow-y-auto ${themeClasses.statBg} p-2 sm:p-3 rounded-lg`}>
                <p className={`text-xs sm:text-sm ${themeClasses.textSecondary} leading-relaxed whitespace-pre-wrap`}>
                  {video.description || "No description available"}
                </p>
              </div>
            </div>

            {/* Video ID and Technical Info */}
            <div>
              <h4 className={`font-semibold mb-2 ${themeClasses.text} text-sm sm:text-base`}>Technical Details</h4>
              <div className={`space-y-2 ${themeClasses.statBg} p-2 sm:p-3 rounded-lg`}>
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-xs sm:text-sm ${themeClasses.textSecondary} flex-shrink-0`}>Video ID:</span>
                  <code className={`text-xs font-mono ${themeClasses.text} bg-black/10 px-2 py-1 rounded truncate max-w-[140px] sm:max-w-[200px]`}>
                    {video.videoId}
                  </code>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-xs sm:text-sm ${themeClasses.textSecondary} flex-shrink-0`}>Channel ID:</span>
                  <code className={`text-xs font-mono ${themeClasses.text} bg-black/10 px-2 py-1 rounded truncate max-w-[140px] sm:max-w-[200px]`}>
                    {video.channelId}
                  </code>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base"
                onClick={() => window.open(getYouTubeUrl(video.videoId), "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch on YouTube
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg} text-xs sm:text-sm`}
                  onClick={() => {
                    copyToClipboard(getYouTubeUrl(video.videoId));
                  }}
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className={`${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} ${themeClasses.hoverBg} text-xs sm:text-sm`}
                  onClick={() => {
                    copyToClipboard(video.videoId);
                  }}
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Copy ID
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Custom Hook for API calls
const useVideoApi = () => {
  const API_BASE_URL = 'http://localhost:3000';

  const fetchVideos = async (
    currentPage: number,
    itemsPerPage: number,
    sortBy: string,
    sortOrder: string,
    filterChannel: string,
    searchQuery: string = '',
    isSearch: boolean = false
  ): Promise<ApiResponse | SearchResponse> => {
    let url: string;
    let options: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (isSearch && searchQuery.trim()) {
      // Search API
      url = `${API_BASE_URL}/api/search`;
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          page: currentPage,
          limit: itemsPerPage,
          sortBy: sortBy === 'recent' ? 'publishedAt' : sortBy,
          sortOrder
        })
      };
    } else {
      // Regular videos API
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy === 'recent' ? 'publishedAt' : sortBy,
        sortOrder,
        ...(filterChannel !== 'all' && { channelId: filterChannel })
      });
      url = `${API_BASE_URL}/api/videos?${params}`;
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse | SearchResponse = await response.json();
    
    if (data.status !== 'success') {
      throw new Error('API returned error status');
    }

    return data;
  };

  return { fetchVideos };
};

// Main Dashboard Component
export default function YouTubeAnalyzerDashboard() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const themeClasses = getThemeClasses(isDarkMode);

  // Modal state
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterChannel, setFilterChannel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API state
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Custom hook
  const { fetchVideos } = useVideoApi();

  // Memoized unique channels
  const uniqueChannels = useMemo(() => {
    return Array.from(new Set(videos.map(video => video.channelTitle)));
  }, [videos]);

  // API call wrapper
  const loadVideos = async (isSearch: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchVideos(
        currentPage,
        itemsPerPage,
        sortBy,
        sortOrder,
        filterChannel,
        searchQuery,
        isSearch
      );
      
      setVideos(data.data.videos);
      setPagination(data.data.pagination);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadVideos();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, filterChannel]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        setCurrentPage(1);
        loadVideos(true);
      } else if (searchQuery === '') {
        setCurrentPage(1);
        loadVideos(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleChannelFilterChange = (value: string) => {
    setFilterChannel(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handleRefresh = () => {
    loadVideos(searchQuery.trim() ? true : false);
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Header */}
      <Header
        themeClasses={themeClasses}
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        loading={loading}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        onToggleTheme={handleToggleTheme}
      />

      {/* Filters */}
      <Filters
        themeClasses={themeClasses}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterChannel={filterChannel}
        itemsPerPage={itemsPerPage}
        uniqueChannels={uniqueChannels}
        onSortChange={handleSortChange}
        onSortOrderChange={handleSortOrderChange}
        onChannelFilterChange={handleChannelFilterChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <StatsCard
            icon={<Play className="h-full w-full" />}
            title="Total Videos"
            value={pagination.total}
            bgColor="bg-red-600/20"
            iconColor="text-red-500"
            themeClasses={themeClasses}
          />
          <StatsCard
            icon={<Users className="h-full w-full" />}
            title="Channels"
            value={uniqueChannels.length}
            bgColor="bg-blue-600/20"
            iconColor="text-blue-500"
            themeClasses={themeClasses}
          />
          <StatsCard
            icon={<Eye className="h-full w-full" />}
            title="Current Page"
            value={pagination.page}
            bgColor="bg-green-600/20"
            iconColor="text-green-500"
            themeClasses={themeClasses}
          />
          <StatsCard
            icon={<Calendar className="h-full w-full" />}
            title="Total Pages"
            value={pagination.totalPages}
            bgColor="bg-purple-600/20"
            iconColor="text-purple-500"
            themeClasses={themeClasses}
          />
        </div>

        {/* Status and Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <span className={`text-xs sm:text-sm ${themeClasses.textSecondary}`}>
            {loading ? 'Loading videos...' : 
             error ? `Error: ${error}` :
             `Showing ${videos.length} videos (Page ${pagination.page} of ${pagination.totalPages})`}
          </span>
          {searchQuery && !loading && (
            <span className={`text-xs sm:text-sm ${themeClasses.textSecondary}`}>
              Search results for "{searchQuery}"
            </span>
          )}
        </div>

        {/* Videos Table */}
        <VideoTable
          videos={videos}
          loading={loading}
          error={error}
          themeClasses={themeClasses}
          onVideoClick={handleVideoClick}
          onRefresh={handleRefresh}
        />

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          loading={loading}
          themeClasses={themeClasses}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </main>

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        themeClasses={themeClasses}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
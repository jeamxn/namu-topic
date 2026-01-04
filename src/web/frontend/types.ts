// API 응답 타입들

export interface RelatedInfo {
  category: string;
  relatedPeople: string;
  occurredAt: string;
  relatedKeywords: string;
}

export interface RelatedLink {
  title: string;
  url: string;
  description: string;
}

export interface RelatedImage {
  description: string;
  url: string;
}

export interface AiAnalysis {
  _id: string;
  trendingSnapshotId: string;
  keyword: string;
  summary: string;
  reason: string;
  publicOpinion: string;
  relatedInfo: RelatedInfo;
  relatedLinks: RelatedLink[];
  relatedImages: RelatedImage[];
}

export interface TrendingItem {
  _id: string;
  crawlSessionId: string;
  rank: number;
  keyword: string;
  url: string;
  aiAnalysis: AiAnalysis | null;
}

export interface CrawlSession {
  _id: string;
  createdAt: string;
  done: boolean;
}

export interface LatestTrendingResponse {
  trending: TrendingItem[];
  session: CrawlSession | null;
}

export interface HistoryKeyword {
  rank: number;
  keyword: string;
}

export interface HistoryEntry {
  timestamp: string;
  sessionId: string;
  keywords: HistoryKeyword[];
}

export interface KeywordRankEntry {
  timestamp: string;
  rank: number | null;
}

export interface RecordEntry {
  sessionId: string;
  timestamp: string;
  keywords: HistoryKeyword[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecordsResponse {
  records: RecordEntry[];
  pagination: Pagination;
}

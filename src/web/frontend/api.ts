import type { HistoryEntry, KeywordRankEntry, LatestTrendingResponse, RecordsResponse } from "./types";

const API_BASE = "/api";

export async function fetchLatestTrending(): Promise<LatestTrendingResponse> {
  const res = await fetch(`${API_BASE}/trending/latest`);
  if (!res.ok) throw new Error("Failed to fetch latest trending");
  return res.json() as Promise<LatestTrendingResponse>;
}

export async function fetchTrendingHistory(hours = 24): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE}/trending/history?hours=${hours}`);
  if (!res.ok) throw new Error("Failed to fetch trending history");
  return res.json() as Promise<HistoryEntry[]>;
}

export async function fetchKeywordRankHistory(keyword: string, hours = 24): Promise<KeywordRankEntry[]> {
  const res = await fetch(`${API_BASE}/trending/keyword/${encodeURIComponent(keyword)}?hours=${hours}`);
  if (!res.ok) throw new Error("Failed to fetch keyword history");
  return res.json() as Promise<KeywordRankEntry[]>;
}

export async function fetchTrendingRecords(page = 1, limit = 20): Promise<RecordsResponse> {
  const res = await fetch(`${API_BASE}/trending/records?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch trending records");
  return res.json() as Promise<RecordsResponse>;
}

export interface KeywordDetailResponse {
  trending: {
    _id: string;
    rank: number;
    keyword: string;
    url: string;
  } | null;
  aiAnalysis: {
    _id: string;
    keyword: string;
    summary: string;
    reason: string;
    publicOpinion: string;
    relatedInfo: {
      category: string;
      relatedPeople: string;
      occurredAt: string;
      relatedKeywords: string;
    };
    relatedLinks: { title: string; url: string; description: string }[];
    relatedImages: { description: string; url: string }[];
  } | null;
}

export async function fetchKeywordDetail(sessionId: string, keyword: string): Promise<KeywordDetailResponse> {
  const params = new URLSearchParams({ sessionId, keyword });
  const res = await fetch(`${API_BASE}/trending/keyword-detail?${params}`);
  if (!res.ok) throw new Error("Failed to fetch keyword detail");
  return res.json() as Promise<KeywordDetailResponse>;
}

import dayjs from "dayjs";
import { useState } from "react";

import { fetchKeywordDetail, type KeywordDetailResponse } from "../api";
import type { RecordEntry, RecordsResponse } from "../types";

interface TrendingRecordsProps {
  data: RecordsResponse;
  onPageChange: (page: number) => void;
}

export default function TrendingRecords({ data, onPageChange }: TrendingRecordsProps) {
  const { records, pagination } = data;
  const [selectedKeyword, setSelectedKeyword] = useState<{
    sessionId: string;
    keyword: string;
    rank: number;
  } | null>(null);
  const [keywordDetail, setKeywordDetail] = useState<KeywordDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      full: date.toLocaleString("ko-KR"),
    };
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDateTime(dateStr).full;
  };

  const handleKeywordClick = async (sessionId: string, keyword: string, rank: number) => {
    setSelectedKeyword({ sessionId, keyword, rank });
    setDetailLoading(true);
    try {
      const detail = await fetchKeywordDetail(sessionId, keyword);
      setKeywordDetail(detail);
    } catch (err) {
      console.error("Failed to fetch keyword detail:", err);
      setKeywordDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedKeyword(null);
    setKeywordDetail(null);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-8 h-8 text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-zinc-500 text-sm">순위 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
          실시간 검색어 순위 기록
        </h2>
        <div className="text-xs sm:text-sm text-zinc-500">
          총 <span className="text-zinc-200 font-medium mono">{pagination.total}</span>개의 기록
        </div>
      </div>

      {/* 레코드 목록 */}
      <div className="space-y-3">
        {records.map((record, idx) => (
          <RecordCard
            key={record.sessionId}
            record={record}
            formatDateTime={formatDateTime}
            getRelativeTime={getRelativeTime}
            isLatest={pagination.page === 1 && idx === 0}
            onKeywordClick={handleKeywordClick}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <Pagination current={pagination.page} total={pagination.totalPages} onChange={onPageChange} />
      )}

      {/* 키워드 상세 모달 */}
      {selectedKeyword && (
        <KeywordDetailModal
          keyword={selectedKeyword.keyword}
          rank={selectedKeyword.rank}
          detail={keywordDetail}
          loading={detailLoading}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

interface RecordCardProps {
  record: RecordEntry;
  formatDateTime: (dateStr: string) => { date: string; time: string; full: string };
  getRelativeTime: (dateStr: string) => string;
  isLatest: boolean;
  onKeywordClick: (sessionId: string, keyword: string, rank: number) => void;
}

function RecordCard({ record, formatDateTime, getRelativeTime, isLatest, onKeywordClick }: RecordCardProps) {
  const { date, time } = formatDateTime(record.timestamp);

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border transition-colors duration-150
        ${
          isLatest
            ? "bg-zinc-900 border-zinc-700"
            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
        }
      `}>
      {/* 최신 배지 */}
      {isLatest && (
        <div className="absolute top-0 right-0">
          <div className="px-2 py-0.5 bg-zinc-100 text-zinc-900 text-[10px] font-medium rounded-bl-md">
            최신
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* 타임스탬프 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs sm:text-sm">{date}</span>
            <span className="text-zinc-700 hidden sm:inline">·</span>
            <span className="mono text-xs sm:text-sm">{time}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-zinc-500 bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-md">
            {getRelativeTime(record.timestamp)}
          </span>
        </div>

        {/* 키워드 순위 목록 */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
          {record.keywords.map((item) => (
            <button
              key={`${record.sessionId}-${item.rank}`}
              onClick={() => onKeywordClick(record.sessionId, item.keyword, item.rank)}
              className="flex items-center gap-2 p-2 sm:p-2.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors cursor-pointer text-left group">
              <span
                className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-semibold mono shrink-0
                  ${
                    item.rank === 1
                      ? "bg-zinc-100 text-zinc-900"
                      : "bg-zinc-800 text-zinc-400"
                  }
                `}>
                {item.rank}
              </span>
              <span
                className="text-xs sm:text-sm text-zinc-300 truncate flex-1 group-hover:text-zinc-100 transition-colors"
                title={item.keyword}>
                {item.keyword}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface KeywordDetailModalProps {
  keyword: string;
  rank: number;
  detail: KeywordDetailResponse | null;
  loading: boolean;
  onClose: () => void;
}

function KeywordDetailModal({ keyword, rank, detail, loading, onClose }: KeywordDetailModalProps) {
  const analysis = detail?.aiAnalysis;

  const formatDate = (value: string): string => {
    const utcMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*UTC$/i);
    if (utcMatch) {
      const dateStr = `${utcMatch[1]}T${utcMatch[2]}Z`;
      return dayjs(dateStr).format("YYYY. MM. DD. HH:mm:ss");
    }
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format("YYYY. MM. DD. HH:mm:ss");
    }
    return value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
        {/* 헤더 */}
        <div className="relative p-5 border-b border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3 sm:gap-4 pr-10">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-100 text-base mono shrink-0">
              {rank}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">{keyword}</h2>
              {detail?.trending?.url && (
                <a
                  href={detail.trending.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 mt-1">
                  나무위키에서 보기
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-full bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-zinc-800/60 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-28 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-full bg-zinc-800/60 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-zinc-800/60 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
                      <div className="h-3 w-12 bg-zinc-800/60 rounded animate-pulse mb-1" />
                      <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : analysis ? (
            <>
              {analysis.summary && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">요약</h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              {analysis.reason && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">
                    실검에 오른 이유
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.reason}</p>
                </div>
              )}

              {analysis.publicOpinion && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">
                    여론 및 반응
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.publicOpinion}</p>
                </div>
              )}

              {analysis.relatedInfo && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">관련 정보</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.relatedInfo.category && analysis.relatedInfo.category !== "-" && (
                      <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 mb-1">분류</div>
                        <div className="text-xs sm:text-sm text-zinc-200">{analysis.relatedInfo.category}</div>
                      </div>
                    )}
                    {analysis.relatedInfo.relatedPeople && analysis.relatedInfo.relatedPeople !== "-" && (
                      <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 mb-1">관련 인물</div>
                        <div className="text-xs sm:text-sm text-zinc-200">
                          {analysis.relatedInfo.relatedPeople}
                        </div>
                      </div>
                    )}
                    {analysis.relatedInfo.occurredAt && analysis.relatedInfo.occurredAt !== "-" && (
                      <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 mb-1">발생 시점</div>
                        <div className="text-xs sm:text-sm text-zinc-200">
                          {formatDate(analysis.relatedInfo.occurredAt)}
                        </div>
                      </div>
                    )}
                    {analysis.relatedInfo.relatedKeywords && analysis.relatedInfo.relatedKeywords !== "-" && (
                      <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 mb-1">관련 키워드</div>
                        <div className="text-xs sm:text-sm text-zinc-200">
                          {analysis.relatedInfo.relatedKeywords}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">관련 링크</h3>
                  <div className="space-y-1.5">
                    {analysis.relatedLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group">
                        <div className="font-medium text-zinc-200 text-xs sm:text-sm group-hover:text-blue-400 transition-colors truncate">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-[11px] sm:text-xs text-zinc-500 mt-1 line-clamp-2">
                            {link.description}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {analysis.relatedImages && analysis.relatedImages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">관련 이미지</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.relatedImages.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group text-xs">
                        <svg
                          className="w-3.5 h-3.5 text-zinc-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors">
                          {img.description || `이미지 ${idx + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-xs sm:text-sm">AI 분석 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

function Pagination({ current, total, onChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const showPages = 5;
    const halfShow = Math.floor(showPages / 2);

    let startPage = Math.max(1, current - halfShow);
    const endPage = Math.min(total, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < total) {
      if (endPage < total - 1) pages.push("...");
      pages.push(total);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {/* 이전 */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`
          w-9 h-9 rounded-md flex items-center justify-center transition-colors border
          ${
            current === 1
              ? "bg-zinc-900/40 text-zinc-700 border-zinc-800 cursor-not-allowed"
              : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800"
          }
        `}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-zinc-600 text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`
                w-9 h-9 rounded-md text-sm transition-colors mono border
                ${
                  current === page
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-zinc-800"
                }
              `}>
              {page}
            </button>
          ),
        )}
      </div>

      {/* 다음 */}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className={`
          w-9 h-9 rounded-md flex items-center justify-center transition-colors border
          ${
            current === total
              ? "bg-zinc-900/40 text-zinc-700 border-zinc-800 cursor-not-allowed"
              : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800"
          }
        `}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

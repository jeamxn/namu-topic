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
        <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-slate-500">순위 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 sm:h-6 rounded-full bg-linear-to-b from-cyan-400 to-violet-500" />
          실시간 검색어 순위 기록
        </h2>
        <div className="text-xs sm:text-sm text-slate-500">
          총 <span className="text-cyan-400 font-medium">{pagination.total}</span>개의 기록
        </div>
      </div>

      {/* 레코드 목록 */}
      <div className="space-y-3 sm:space-y-4">
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
        relative overflow-hidden rounded-xl border transition-all duration-300
        ${
          isLatest
            ? "bg-linear-to-r from-cyan-500/5 to-violet-500/5 border-cyan-500/30"
            : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
        }
      `}>
      {/* 최신 배지 */}
      {isLatest && (
        <div className="absolute top-0 right-0">
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-linear-to-r from-cyan-500 to-violet-500 text-white text-[10px] sm:text-xs font-medium rounded-bl-lg">
            최신
          </div>
        </div>
      )}

      <div className="p-3 sm:p-5">
        {/* 타임스탬프 */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs sm:text-sm">{date}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="mono text-xs sm:text-sm">{time}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-800/50 px-1.5 sm:px-2 py-0.5 rounded-full">
            {getRelativeTime(record.timestamp)}
          </span>
        </div>

        {/* 키워드 순위 목록 */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
          {record.keywords.map((item) => (
            <button
              key={`${record.sessionId}-${item.rank}`}
              onClick={() => onKeywordClick(record.sessionId, item.keyword, item.rank)}
              className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all cursor-pointer text-left group">
              <span
                className={`
                  w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold mono shrink-0
                  ${
                    item.rank === 1
                      ? "bg-linear-to-br from-amber-400 to-orange-500 text-white"
                      : item.rank === 2
                        ? "bg-linear-to-br from-slate-300 to-slate-400 text-slate-800"
                        : item.rank === 3
                          ? "bg-linear-to-br from-amber-600 to-amber-700 text-white"
                          : "bg-slate-700 text-slate-400"
                  }
                `}>
                {item.rank}
              </span>
              <span
                className="text-xs sm:text-sm text-slate-300 truncate flex-1 group-hover:text-cyan-300 transition-colors"
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

  // 날짜 포맷 함수
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700/50 bg-linear-to-br from-slate-800 to-slate-900 shadow-2xl">
        {/* 헤더 */}
        <div className="relative p-4 sm:p-6 border-b border-slate-700/50 bg-linear-to-r from-cyan-500/5 to-violet-500/5">
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-3 sm:gap-4 pr-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-white text-base sm:text-lg mono shadow-lg shrink-0">
              {rank}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">{keyword}</h2>
              {detail?.trending?.url && (
                <a
                  href={detail.trending.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1">
                  나무위키에서 보기
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-4 sm:space-y-6">
              {/* 요약 스켈레톤 */}
              <div className="space-y-2">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-full bg-slate-700/50 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-slate-700/50 rounded animate-pulse" />
              </div>
              {/* 이유 스켈레톤 */}
              <div className="space-y-2">
                <div className="h-4 w-28 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-full bg-slate-700/50 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-700/50 rounded animate-pulse" />
              </div>
              {/* 관련 정보 스켈레톤 */}
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                      <div className="h-3 w-12 bg-slate-700/50 rounded animate-pulse mb-1" />
                      <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* 요약 */}
              {analysis.summary && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">📌 요약</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              {/* 실검 이유 */}
              {analysis.reason && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">🔥 실검에 오른 이유</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.reason}</p>
                </div>
              )}

              {/* 여론 및 반응 */}
              {analysis.publicOpinion && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">💬 여론 및 반응</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.publicOpinion}</p>
                </div>
              )}

              {/* 관련 정보 */}
              {analysis.relatedInfo && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">📋 관련 정보</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.relatedInfo.category && analysis.relatedInfo.category !== "-" && (
                      <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">분류</div>
                        <div className="text-xs sm:text-sm text-slate-300 font-medium">
                          {analysis.relatedInfo.category}
                        </div>
                      </div>
                    )}
                    {analysis.relatedInfo.relatedPeople && analysis.relatedInfo.relatedPeople !== "-" && (
                      <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">관련 인물</div>
                        <div className="text-xs sm:text-sm text-slate-300 font-medium">
                          {analysis.relatedInfo.relatedPeople}
                        </div>
                      </div>
                    )}
                    {analysis.relatedInfo.occurredAt && analysis.relatedInfo.occurredAt !== "-" && (
                      <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">발생 시점</div>
                        <div className="text-xs sm:text-sm text-slate-300 font-medium">
                          {formatDate(analysis.relatedInfo.occurredAt)}
                        </div>
                      </div>
                    )}
                    {analysis.relatedInfo.relatedKeywords && analysis.relatedInfo.relatedKeywords !== "-" && (
                      <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">관련 키워드</div>
                        <div className="text-xs sm:text-sm text-slate-300 font-medium">
                          {analysis.relatedInfo.relatedKeywords}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 관련 링크 */}
              {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">🔗 관련 링크</h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {analysis.relatedLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                        <div className="font-medium text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors truncate">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
                            {link.description}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 이미지 */}
              {analysis.relatedImages && analysis.relatedImages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-xs sm:text-sm">🖼️ 관련 이미지</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.relatedImages.map((img, idx) => (
                      <a
                        key={idx}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/50 hover:bg-slate-800 transition-all group text-xs sm:text-sm">
                        <svg
                          className="w-3.5 h-3.5 text-pink-400 group-hover:text-pink-300"
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
                        <span className="text-slate-300 group-hover:text-pink-300 transition-colors">
                          {img.description || `이미지 ${idx + 1}`}
                        </span>
                        <svg
                          className="w-3 h-3 text-slate-500 group-hover:text-pink-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 text-slate-500">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
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
      {/* 이전 버튼 */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all
          ${
            current === 1
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
          }
        `}>
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      <div className="flex gap-0.5 sm:gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 text-xs sm:text-sm">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium text-xs sm:text-sm transition-all mono
                ${
                  current === page
                    ? "bg-linear-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/25"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
                }
              `}>
              {page}
            </button>
          ),
        )}
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all
          ${
            current === total
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
          }
        `}>
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

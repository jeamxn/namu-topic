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
      date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
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
    return <div className="text-center py-16 text-zinc-500 text-sm">순위 기록이 없습니다</div>;
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-zinc-900">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Archive · 순위 기록</h2>
        <span className="mono tabular text-[11px] text-zinc-600">
          {pagination.total.toLocaleString()} entries
        </span>
      </div>

      {/* 타임라인 */}
      <div className="divide-y divide-zinc-900">
        {records.map((record, idx) => (
          <RecordRow
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
        <div className="mt-10">
          <Pagination current={pagination.page} total={pagination.totalPages} onChange={onPageChange} />
        </div>
      )}

      {/* 모달 */}
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

interface RecordRowProps {
  record: RecordEntry;
  formatDateTime: (dateStr: string) => { date: string; time: string; full: string };
  getRelativeTime: (dateStr: string) => string;
  isLatest: boolean;
  onKeywordClick: (sessionId: string, keyword: string, rank: number) => void;
}

function RecordRow({ record, formatDateTime, getRelativeTime, isLatest, onKeywordClick }: RecordRowProps) {
  const { date, time } = formatDateTime(record.timestamp);

  return (
    <div className="py-6 sm:py-7 grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-8">
      {/* 좌측: 시간 앵커 */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="mono tabular text-xl sm:text-2xl font-light text-zinc-100 leading-none">
            {time}
          </span>
          {isLatest && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-400">Latest</span>
          )}
        </div>
        <div className="text-[11px] text-zinc-500">{date}</div>
        <div className="text-[10px] text-zinc-600">{getRelativeTime(record.timestamp)}</div>
      </div>

      {/* 우측: 키워드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2">
        {record.keywords.map((item) => (
          <button
            key={`${record.sessionId}-${item.rank}`}
            onClick={() => onKeywordClick(record.sessionId, item.keyword, item.rank)}
            className="flex items-center gap-2 py-1 text-left group">
            <span
              className={`mono tabular text-xs shrink-0 ${
                item.rank === 1 ? "text-zinc-100" : "text-zinc-600"
              } group-hover:text-zinc-200 transition-colors`}>
              {String(item.rank).padStart(2, "0")}
            </span>
            <span
              className="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-100 transition-colors truncate"
              title={item.keyword}>
              {item.keyword}
            </span>
          </button>
        ))}
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
    if (parsed.isValid()) return parsed.format("YYYY. MM. DD. HH:mm:ss");
    return value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-hidden bg-zinc-950 border border-zinc-900">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-zinc-900">
          <div className="flex items-baseline gap-4 min-w-0">
            <span className="mono tabular font-light text-3xl sm:text-4xl text-zinc-700 leading-none">
              {String(rank).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 truncate">
                {keyword}
              </h2>
              {detail?.trending?.url && (
                <a
                  href={detail.trending.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-200 transition-colors">
                  나무위키
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
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-5 sm:p-6 space-y-7 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-5">
              <div className="h-3 w-16 bg-zinc-900 rounded animate-pulse" />
              <div className="h-3 w-full bg-zinc-900/60 rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-zinc-900/60 rounded animate-pulse" />
              <div className="h-3 w-24 bg-zinc-900 rounded animate-pulse mt-6" />
              <div className="h-3 w-full bg-zinc-900/60 rounded animate-pulse" />
            </div>
          ) : analysis ? (
            <>
              {analysis.summary && (
                <ModalSection title="요약">
                  <p className="text-zinc-300 text-sm leading-relaxed">{analysis.summary}</p>
                </ModalSection>
              )}
              {analysis.reason && (
                <ModalSection title="실검 사유">
                  <p className="text-zinc-300 text-sm leading-relaxed">{analysis.reason}</p>
                </ModalSection>
              )}
              {analysis.publicOpinion && (
                <ModalSection title="여론">
                  <p className="text-zinc-300 text-sm leading-relaxed">{analysis.publicOpinion}</p>
                </ModalSection>
              )}
              {analysis.relatedInfo && (
                <ModalSection title="관련 정보">
                  <dl className="divide-y divide-zinc-900">
                    <DefRow label="분류" value={analysis.relatedInfo.category} />
                    <DefRow label="관련 인물" value={analysis.relatedInfo.relatedPeople} />
                    <DefRow
                      label="발생 시점"
                      value={
                        analysis.relatedInfo.occurredAt && analysis.relatedInfo.occurredAt !== "-"
                          ? formatDate(analysis.relatedInfo.occurredAt)
                          : ""
                      }
                    />
                    <DefRow label="관련 키워드" value={analysis.relatedInfo.relatedKeywords} />
                  </dl>
                </ModalSection>
              )}
              {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
                <ModalSection title="관련 링크">
                  <ul className="divide-y divide-zinc-900">
                    {analysis.relatedLinks.map((link, idx) => (
                      <li key={idx}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block py-3">
                          <div className="text-sm text-zinc-200 group-hover:text-zinc-50 leading-snug">
                            {link.title}
                          </div>
                          {link.description && (
                            <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                              {link.description}
                            </div>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </ModalSection>
              )}
              {analysis.relatedImages && analysis.relatedImages.length > 0 && (
                <ModalSection title="관련 이미지">
                  <ul className="space-y-1.5">
                    {analysis.relatedImages.map((img, idx) => (
                      <li key={idx}>
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100">
                          <span className="text-zinc-700">↗</span>
                          <span>{img.description || `이미지 ${idx + 1}`}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </ModalSection>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500 py-8 text-center">AI 분석 결과가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "-") return null;
  return (
    <div className="flex items-start gap-4 py-2.5">
      <dt className="w-20 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500 pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-zinc-200">{value}</dd>
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
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < total) {
      if (endPage < total - 1) pages.push("...");
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
          current === 1 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-100"
        }`}>
        ← Prev
      </button>
      <div className="flex">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`e-${idx}`} className="w-9 h-9 flex items-center justify-center text-zinc-600 text-sm">
              ···
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`mono tabular w-9 h-9 text-sm transition-colors ${
                current === page
                  ? "text-zinc-100 font-medium border-b border-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}>
              {page}
            </button>
          ),
        )}
      </div>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className={`px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
          current === total ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-zinc-100"
        }`}>
        Next →
      </button>
    </div>
  );
}

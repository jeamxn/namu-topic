import type { RecordEntry, RecordsResponse } from "../types";

interface TrendingRecordsProps {
  data: RecordsResponse;
  onPageChange: (page: number) => void;
}

export default function TrendingRecords({ data, onPageChange }: TrendingRecordsProps) {
  const { records, pagination } = data;

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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500" />
          실시간 검색어 순위 기록
        </h2>
        <div className="text-sm text-slate-500">
          총 <span className="text-cyan-400 font-medium">{pagination.total}</span>개의 기록
        </div>
      </div>

      {/* 레코드 목록 */}
      <div className="space-y-4">
        {records.map((record, idx) => (
          <RecordCard
            key={record.sessionId}
            record={record}
            formatDateTime={formatDateTime}
            getRelativeTime={getRelativeTime}
            isLatest={pagination.page === 1 && idx === 0}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <Pagination current={pagination.page} total={pagination.totalPages} onChange={onPageChange} />
      )}
    </div>
  );
}

interface RecordCardProps {
  record: RecordEntry;
  formatDateTime: (dateStr: string) => { date: string; time: string; full: string };
  getRelativeTime: (dateStr: string) => string;
  isLatest: boolean;
}

function RecordCard({ record, formatDateTime, getRelativeTime, isLatest }: RecordCardProps) {
  const { date, time } = formatDateTime(record.timestamp);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300
        ${
          isLatest
            ? "bg-gradient-to-r from-cyan-500/5 to-violet-500/5 border-cyan-500/30"
            : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
        }
      `}>
      {/* 최신 배지 */}
      {isLatest && (
        <div className="absolute top-0 right-0">
          <div className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-medium rounded-bl-lg">
            최신
          </div>
        </div>
      )}

      <div className="p-5">
        {/* 타임스탬프 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{date}</span>
            <span className="text-slate-600">•</span>
            <span className="mono text-sm">{time}</span>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
            {getRelativeTime(record.timestamp)}
          </span>
        </div>

        {/* 키워드 순위 목록 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {record.keywords.map((item) => (
            <div
              key={`${record.sessionId}-${item.rank}`}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/30">
              <span
                className={`
                  w-6 h-6 rounded flex items-center justify-center text-xs font-bold mono
                  ${
                    item.rank === 1
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                      : item.rank === 2
                        ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800"
                        : item.rank === 3
                          ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white"
                          : "bg-slate-700 text-slate-400"
                  }
                `}>
                {item.rank}
              </span>
              <span className="text-sm text-slate-300 truncate flex-1" title={item.keyword}>
                {item.keyword}
              </span>
            </div>
          ))}
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
  // 표시할 페이지 번호 계산
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
    <div className="flex items-center justify-center gap-2">
      {/* 이전 버튼 */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center transition-all
          ${
            current === 1
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
          }
        `}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호 */}
      <div className="flex gap-1">
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-500">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={`
                w-10 h-10 rounded-lg font-medium text-sm transition-all mono
                ${
                  current === page
                    ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/25"
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
          w-10 h-10 rounded-lg flex items-center justify-center transition-all
          ${
            current === total
              ? "bg-slate-800/30 text-slate-600 cursor-not-allowed"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50"
          }
        `}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

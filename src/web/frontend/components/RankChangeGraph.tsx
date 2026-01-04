import React, { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { HistoryEntry, TrendingItem } from "../types";

interface RankChangeGraphProps {
  historyData: HistoryEntry[];
  trendingData: TrendingItem[];
}

// 고정 색상 팔레트 (구분하기 쉬운 색상들)
const COLORS = [
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
];

export default function RankChangeGraph({ historyData, trendingData }: RankChangeGraphProps) {
  // 24시간 내 한 번이라도 TOP 10에 들어간 모든 키워드 추출
  const allKeywordsInHistory = useMemo(() => {
    const keywordSet = new Set<string>();

    // 히스토리에서 TOP 10에 포함된 모든 키워드 수집
    historyData.forEach((entry) => {
      entry.keywords.slice(0, 10).forEach((k) => {
        keywordSet.add(k.keyword);
      });
    });

    // 현재 TOP 10도 추가
    trendingData.slice(0, 10).forEach((item) => {
      keywordSet.add(item.keyword);
    });

    // 현재 순위 기준으로 정렬 (현재 TOP 10 우선, 나머지는 알파벳순)
    const currentRanks = new Map(trendingData.map((t) => [t.keyword, t.rank]));
    return Array.from(keywordSet).sort((a, b) => {
      const rankA = currentRanks.get(a) ?? 999;
      const rankB = currentRanks.get(b) ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });
  }, [historyData, trendingData]);

  // 현재 TOP 10 키워드 (UI 표시용)
  const currentTop10 = useMemo(() => {
    return new Set(trendingData.slice(0, 10).map((item) => item.keyword));
  }, [trendingData]);

  // 선택된 키워드 상태 (기본값: 현재 TOP 5만 선택)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(() => {
    return new Set(trendingData.slice(0, 5).map((t) => t.keyword));
  });

  // 그래프용 데이터 변환
  const chartData = useMemo(() => {
    return historyData.map((entry) => {
      const dataPoint: Record<string, number | string | null> = {
        time: formatTime(entry.timestamp),
        timestamp: entry.timestamp,
      };

      // 각 키워드의 순위 추가 (순위가 없으면 null로 표시)
      allKeywordsInHistory.forEach((keyword) => {
        const found = entry.keywords.find((k) => k.keyword === keyword);
        dataPoint[keyword] = found ? found.rank : null;
      });

      return dataPoint;
    });
  }, [historyData, allKeywordsInHistory]);

  // 키워드 색상 매핑
  const keywordColors = useMemo(() => {
    const colors: Record<string, string> = {};
    allKeywordsInHistory.forEach((keyword, idx) => {
      colors[keyword] = COLORS[idx % COLORS.length]!;
    });
    return colors;
  }, [allKeywordsInHistory]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedKeywords(new Set(allKeywordsInHistory));
  };

  const selectNone = () => {
    setSelectedKeywords(new Set());
  };

  const selectCurrentTop10 = () => {
    setSelectedKeywords(currentTop10);
  };

  if (historyData.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">히스토리 데이터가 없습니다</p>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">데이터가 수집되면 그래프가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1.5 h-5 sm:h-6 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500" />
          <span className="hidden xs:inline">실시간 검색어 순위 변동 (최근 24시간)</span>
          <span className="xs:hidden">순위 변동 (24시간)</span>
        </h2>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={selectCurrentTop10}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50 transition-colors">
            현재 TOP 10
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50 transition-colors">
            전체 선택
          </button>
          <button
            onClick={selectNone}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50 transition-colors">
            선택 해제
          </button>
        </div>
      </div>

      {/* 키워드 필터 */}
      <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        {/* 현재 TOP 10 */}
        <div className="mb-4">
          <span className="text-[10px] text-emerald-400 font-medium mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            현재 TOP 10
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {allKeywordsInHistory
              .filter((k) => currentTop10.has(k))
              .map((keyword) => {
                const currentRank = trendingData.find((t) => t.keyword === keyword)?.rank;
                return (
                  <button
                    key={keyword}
                    onClick={() => toggleKeyword(keyword)}
                    className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    transition-all duration-200
                    ${
                      selectedKeywords.has(keyword)
                        ? "text-white shadow-lg"
                        : "bg-slate-800/50 text-slate-500 hover:text-slate-300 border border-slate-700/50"
                    }
                  `}
                    style={{
                      backgroundColor: selectedKeywords.has(keyword) ? keywordColors[keyword] : undefined,
                      boxShadow: selectedKeywords.has(keyword) ? `0 4px 14px ${keywordColors[keyword]}40` : undefined,
                    }}>
                    <span className="font-bold mono text-[10px] opacity-70">#{currentRank}</span>
                    <span>{keyword}</span>
                  </button>
                );
              })}
          </div>
        </div>
        {/* 과거 TOP 10 (현재는 빠진 키워드) */}
        {allKeywordsInHistory.filter((k) => !currentTop10.has(k)).length > 0 && (
          <div>
            <span className="text-[10px] text-slate-500 font-medium mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              과거 TOP 10 (현재 순위권 밖)
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {allKeywordsInHistory
                .filter((k) => !currentTop10.has(k))
                .map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => toggleKeyword(keyword)}
                    className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                    transition-all duration-200
                    ${
                      selectedKeywords.has(keyword)
                        ? "text-white shadow-lg"
                        : "bg-slate-800/50 text-slate-600 hover:text-slate-400 border border-slate-700/30 border-dashed"
                    }
                  `}
                    style={{
                      backgroundColor: selectedKeywords.has(keyword) ? keywordColors[keyword] : undefined,
                      boxShadow: selectedKeywords.has(keyword) ? `0 4px 14px ${keywordColors[keyword]}40` : undefined,
                    }}>
                    <span className="font-bold mono text-[10px] opacity-50">-</span>
                    <span>{keyword}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 그래프 */}
      <div className="p-3 sm:p-6 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={{ stroke: "#475569" }}
              interval="preserveStartEnd"
            />
            <YAxis
              reversed
              domain={[1, 10]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={{ stroke: "#475569" }}
              width={30}
            />
            <Tooltip content={<CustomTooltip keywordColors={keywordColors} />} />
            <Legend
              wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
              formatter={(value) => <span className="text-slate-300 text-xs sm:text-sm">{value}</span>}
            />

            {allKeywordsInHistory
              .filter((keyword) => selectedKeywords.has(keyword))
              .map((keyword) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={keyword}
                  stroke={keywordColors[keyword]}
                  strokeWidth={2}
                  dot={{ fill: keywordColors[keyword], strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 설명 */}
      <div className="text-center text-xs sm:text-sm text-slate-500 px-4">
        💡 그래프에서 순위가 낮을수록(1에 가까울수록) 상위권입니다
      </div>
    </div>
  );
}

// 시간 포맷팅 함수
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// 커스텀 툴팁 컴포넌트
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number | null;
    color: string;
  }>;
  label?: string;
  keywordColors: Record<string, string>;
}

function CustomTooltip({ active, payload, label, keywordColors }: CustomTooltipProps) {
  if (!active || !payload) return null;

  // 순위 기준으로 정렬 (null 값은 마지막으로)
  const sortedPayload = [...payload].sort((a, b) => {
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return (a.value as number) - (b.value as number);
  });

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-3 sm:p-4 shadow-xl max-w-[200px] sm:max-w-none">
      <div className="text-slate-400 text-[10px] sm:text-xs mb-2 sm:mb-3 font-medium">{label}</div>
      <div className="space-y-1.5 sm:space-y-2">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: keywordColors[entry.dataKey] }}
            />
            <span className="text-slate-300 text-[10px] sm:text-sm flex-1 min-w-0 truncate">{entry.dataKey}</span>
            <span
              className="font-bold mono text-[10px] sm:text-sm flex-shrink-0"
              style={{ color: keywordColors[entry.dataKey] }}>
              {entry.value !== null ? `#${entry.value}` : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

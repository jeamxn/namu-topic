import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { HistoryEntry, TrendingItem } from "../types";

interface RankChangeGraphProps {
  historyData: HistoryEntry[];
  trendingData: TrendingItem[];
}

// 톤다운된 색상 팔레트 (다크 테마 친화적)
const COLORS = [
  "#60a5fa", // blue-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f472b6", // pink-400
  "#22d3ee", // cyan-400
  "#f87171", // red-400
  "#a3e635", // lime-400
  "#fb923c", // orange-400
  "#2dd4bf", // teal-400
];

export default function RankChangeGraph({ historyData, trendingData }: RankChangeGraphProps) {
  const allKeywordsInHistory = useMemo(() => {
    const keywordSet = new Set<string>();
    historyData.forEach((entry) => {
      entry.keywords.slice(0, 10).forEach((k) => {
        keywordSet.add(k.keyword);
      });
    });
    trendingData.slice(0, 10).forEach((item) => {
      keywordSet.add(item.keyword);
    });

    const currentRanks = new Map(trendingData.map((t) => [t.keyword, t.rank]));
    return Array.from(keywordSet).sort((a, b) => {
      const rankA = currentRanks.get(a) ?? 999;
      const rankB = currentRanks.get(b) ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });
  }, [historyData, trendingData]);

  const currentTop10 = useMemo(() => {
    return new Set(trendingData.slice(0, 10).map((item) => item.keyword));
  }, [trendingData]);

  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(() => {
    return new Set(trendingData.slice(0, 5).map((t) => t.keyword));
  });

  const chartData = useMemo(() => {
    return historyData.map((entry) => {
      const dataPoint: Record<string, number | string | null> = {
        time: formatTime(entry.timestamp),
        timestamp: entry.timestamp,
      };
      allKeywordsInHistory.forEach((keyword) => {
        const found = entry.keywords.find((k) => k.keyword === keyword);
        dataPoint[keyword] = found ? found.rank : null;
      });
      return dataPoint;
    });
  }, [historyData, allKeywordsInHistory]);

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

  const selectAll = () => setSelectedKeywords(new Set(allKeywordsInHistory));
  const selectNone = () => setSelectedKeywords(new Set());
  const selectCurrentTop10 = () => setSelectedKeywords(currentTop10);

  if (historyData.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-8 h-8 text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-zinc-400 text-sm">히스토리 데이터가 없습니다</p>
        <p className="text-zinc-600 text-xs mt-1">데이터가 수집되면 그래프가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
          <span className="hidden xs:inline">순위 변동 (최근 24시간)</span>
          <span className="xs:hidden">순위 변동 (24시간)</span>
        </h2>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={selectCurrentTop10}
            className="px-3 py-1.5 text-xs rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-colors">
            현재 TOP 10
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-colors">
            전체 선택
          </button>
          <button
            onClick={selectNone}
            className="px-3 py-1.5 text-xs rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-colors">
            선택 해제
          </button>
        </div>
      </div>

      {/* 키워드 필터 */}
      <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
        {/* 현재 TOP 10 */}
        <div className="mb-4">
          <span className="text-[10px] text-zinc-400 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            현재 TOP 10
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allKeywordsInHistory
              .filter((k) => currentTop10.has(k))
              .map((keyword) => {
                const currentRank = trendingData.find((t) => t.keyword === keyword)?.rank;
                const active = selectedKeywords.has(keyword);
                return (
                  <button
                    key={keyword}
                    onClick={() => toggleKeyword(keyword)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                      transition-colors duration-150 border
                      ${
                        active
                          ? "text-zinc-50 border-transparent"
                          : "bg-zinc-900 text-zinc-500 hover:text-zinc-200 border-zinc-800"
                      }
                    `}
                    style={{
                      backgroundColor: active ? `${keywordColors[keyword]}20` : undefined,
                      borderColor: active ? `${keywordColors[keyword]}60` : undefined,
                      color: active ? keywordColors[keyword] : undefined,
                    }}>
                    <span className="font-semibold mono text-[10px] opacity-70">#{currentRank}</span>
                    <span>{keyword}</span>
                  </button>
                );
              })}
          </div>
        </div>
        {/* 과거 TOP 10 */}
        {allKeywordsInHistory.filter((k) => !currentTop10.has(k)).length > 0 && (
          <div>
            <span className="text-[10px] text-zinc-500 font-medium mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              과거 TOP 10
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allKeywordsInHistory
                .filter((k) => !currentTop10.has(k))
                .map((keyword) => {
                  const active = selectedKeywords.has(keyword);
                  return (
                    <button
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs
                        transition-colors duration-150 border
                        ${
                          active
                            ? "border-transparent"
                            : "bg-zinc-900 text-zinc-600 hover:text-zinc-400 border-zinc-800"
                        }
                      `}
                      style={{
                        backgroundColor: active ? `${keywordColors[keyword]}20` : undefined,
                        borderColor: active ? `${keywordColors[keyword]}60` : undefined,
                        color: active ? keywordColors[keyword] : undefined,
                      }}>
                      <span className="font-semibold mono text-[10px] opacity-50">-</span>
                      <span>{keyword}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 그래프 */}
      <div className="p-4 sm:p-5 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="time"
              stroke="#52525b"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              tickLine={{ stroke: "#3f3f46" }}
              interval="preserveStartEnd"
            />
            <YAxis
              reversed
              domain={[1, 10]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              stroke="#52525b"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              tickLine={{ stroke: "#3f3f46" }}
              width={30}
            />
            <Tooltip content={<CustomTooltip keywordColors={keywordColors} />} />
            <Legend
              wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
              formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>}
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
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "#18181b" }}
                  connectNulls={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 설명 */}
      <div className="text-center text-xs text-zinc-500 px-4">
        순위가 낮을수록(1에 가까울수록) 상위권입니다
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

  const sortedPayload = [...payload].sort((a, b) => {
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return (a.value as number) - (b.value as number);
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 shadow-lg max-w-[220px]">
      <div className="text-zinc-400 text-xs mb-2 font-medium mono">{label}</div>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: keywordColors[entry.dataKey] }}
            />
            <span className="text-zinc-300 text-xs flex-1 min-w-0 truncate">{entry.dataKey}</span>
            <span
              className="font-semibold mono text-xs shrink-0"
              style={{ color: keywordColors[entry.dataKey] }}>
              {entry.value !== null ? `#${entry.value}` : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

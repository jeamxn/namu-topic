import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useEffectiveTheme } from "../hooks/useTheme";
import type { HistoryEntry, TrendingItem } from "../types";

interface RankChangeGraphProps {
  historyData: HistoryEntry[];
  trendingData: TrendingItem[];
}

// 카테고리 매핑과 톤 일치하는 팔레트
const COLORS = [
  "#60a5fa", // blue-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#fb7185", // rose-400
  "#38bdf8", // sky-400
  "#f472b6", // pink-400
  "#a3e635", // lime-400
  "#fb923c", // orange-400
  "#2dd4bf", // teal-400
];

export default function RankChangeGraph({ historyData, trendingData }: RankChangeGraphProps) {
  const theme = useEffectiveTheme();
  const isDark = theme === "dark";
  const chartColors = {
    grid: isDark ? "#18181b" : "#e4e4e7",       // zinc-900 : zinc-200
    axis: isDark ? "#3f3f46" : "#a1a1aa",       // zinc-700 : zinc-400
    axisTick: isDark ? "#71717a" : "#71717a",   // zinc-500 양쪽
    tickLine: isDark ? "#27272a" : "#d4d4d8",   // zinc-800 : zinc-300
    activeDotStroke: isDark ? "#09090b" : "#ffffff",
  };

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
        <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">히스토리 데이터가 없습니다</p>
        <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">데이터가 수집되면 그래프가 표시됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-900">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          순위 변동 · 최근 24시간
        </h2>

        <div className="flex gap-4 text-[11px] uppercase tracking-wider">
          <button
            onClick={selectCurrentTop10}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            현재 TOP 10
          </button>
          <button
            onClick={selectAll}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            전체
          </button>
          <button
            onClick={selectNone}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            해제
          </button>
        </div>
      </div>

      {/* 키워드 필터 */}
      <div className="space-y-5">
        {/* 현재 TOP 10 */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            현재 TOP 10
          </div>
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
                    className={`mono tabular flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
                      active ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                    style={{
                      borderBottom: `1px solid ${active ? keywordColors[keyword] : "transparent"}`,
                      color: active ? keywordColors[keyword] : undefined,
                    }}>
                    <span className="opacity-60 text-[10px]">
                      {String(currentRank ?? 0).padStart(2, "0")}
                    </span>
                    <span className="font-sans">{keyword}</span>
                  </button>
                );
              })}
          </div>
        </div>
        {/* 과거 TOP 10 */}
        {allKeywordsInHistory.filter((k) => !currentTop10.has(k)).length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              과거 TOP 10
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allKeywordsInHistory
                .filter((k) => !currentTop10.has(k))
                .map((keyword) => {
                  const active = selectedKeywords.has(keyword);
                  return (
                    <button
                      key={keyword}
                      onClick={() => toggleKeyword(keyword)}
                      className={`mono tabular flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
                        active ? "" : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                      }`}
                      style={{
                        borderBottom: `1px solid ${active ? keywordColors[keyword] : "transparent"}`,
                        color: active ? keywordColors[keyword] : undefined,
                      }}>
                      <span className="opacity-40 text-[10px]">—</span>
                      <span className="font-sans">{keyword}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 그래프 */}
      <div className="pt-4">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={chartColors.grid} />
            <XAxis
              dataKey="time"
              stroke={chartColors.axis}
              tick={{ fill: chartColors.axisTick, fontSize: 10, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
              tickLine={{ stroke: chartColors.tickLine }}
              interval="preserveStartEnd"
            />
            <YAxis
              reversed
              domain={[1, 10]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              stroke={chartColors.axis}
              tick={{ fill: chartColors.axisTick, fontSize: 10, fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
              tickLine={{ stroke: chartColors.tickLine }}
              width={30}
            />
            <Tooltip content={<CustomTooltip keywordColors={keywordColors} isDark={isDark} />} />
            <Legend
              wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }}
              formatter={(value) => <span className="text-zinc-600 dark:text-zinc-400 text-xs">{value}</span>}
            />

            {allKeywordsInHistory
              .filter((keyword) => selectedKeywords.has(keyword))
              .map((keyword) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={keyword}
                  stroke={keywordColors[keyword]}
                  strokeWidth={1.5}
                  dot={{ fill: keywordColors[keyword], strokeWidth: 0, r: 2 }}
                  activeDot={{ r: 4, strokeWidth: 1.5, stroke: chartColors.activeDotStroke }}
                  connectNulls={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mono tabular">
        y축: 순위(1 = 최상위) · x축: 시각
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
  isDark?: boolean;
}

function CustomTooltip({ active, payload, label, keywordColors, isDark }: CustomTooltipProps) {
  if (!active || !payload) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return (a.value as number) - (b.value as number);
  });

  return (
    <div
      className={`rounded-md p-3 shadow-lg max-w-[220px] border ${
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      }`}>
      <div className={`text-xs mb-2 font-medium mono ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{label}</div>
      <div className="space-y-1.5">
        {sortedPayload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: keywordColors[entry.dataKey] }}
            />
            <span className={`text-xs flex-1 min-w-0 truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{entry.dataKey}</span>
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

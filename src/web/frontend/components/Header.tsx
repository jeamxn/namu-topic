import dayjs from "dayjs";

import type { TrendingItem } from "../types";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  lastUpdated: string | null;
  trending?: TrendingItem[];
}

export default function Header({ lastUpdated, trending = [] }: HeaderProps) {
  const formatDate = (dateStr: string) => dayjs(dateStr).format("YYYY.MM.DD HH:mm:ss");
  const formatDateShort = (dateStr: string) => dayjs(dateStr).format("MM.DD HH:mm");

  const tickerItems = trending.slice(0, 10);
  // 끊김 없는 무한 스크롤 위해 두 번 반복
  const tickerLoop = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : [];

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          {/* 사이트 타이틀 */}
          <div className="flex items-baseline gap-3 min-w-0">
            <h1 className="font-display text-base sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              나무위키 실시간 검색어
            </h1>
            <span className="hidden md:inline text-[11px] uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600">
              Trending Index
            </span>
          </div>

          {/* 우측: 모노 시계 + 테마 토글 */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {lastUpdated && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-zinc-500 hidden sm:inline">
                  Live
                </span>
                <span className="mono tabular text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="hidden sm:inline">{formatDate(lastUpdated)}</span>
                  <span className="sm:hidden">{formatDateShort(lastUpdated)}</span>
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 가로 마퀴 티커 */}
      {tickerLoop.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
          <div className="marquee py-2.5">
            <div className="marquee__track">
              {tickerLoop.map((item, idx) => (
                <span
                  key={`${item._id}-${idx}`}
                  className="mono tabular text-[11px] sm:text-xs text-zinc-500 px-6 inline-flex items-center gap-3">
                  <span className="text-zinc-400 dark:text-zinc-600">
                    {String(item.rank).padStart(2, "0")}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">/</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{item.keyword}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

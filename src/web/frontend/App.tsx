import type React from "react";
import { useEffect, useState } from "react";

import { fetchLatestTrending, fetchTrendingHistory, fetchTrendingRecords } from "./api";
import Header from "./components/Header";
import RankChangeGraph from "./components/RankChangeGraph";
import TrendingRankings from "./components/TrendingRankings";
import TrendingRecords from "./components/TrendingRecords";
import type { HistoryEntry, LatestTrendingResponse, RecordsResponse } from "./types";

type TabType = "rankings" | "graph" | "records";

const VALID_TABS: TabType[] = ["rankings", "graph", "records"];

const getTabFromHash = (): TabType => {
  if (typeof window === "undefined") return "rankings";
  const hash = window.location.hash.replace(/^#/, "") as TabType;
  return VALID_TABS.includes(hash) ? hash : "rankings";
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromHash);
  const [latestData, setLatestData] = useState<LatestTrendingResponse | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [recordsData, setRecordsData] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHash = window.location.hash.replace(/^#/, "");
    if (currentHash !== activeTab) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [latest, history, records] = await Promise.all([
          fetchLatestTrending(),
          fetchTrendingHistory(24),
          fetchTrendingRecords(currentPage, 20),
        ]);
        setLatestData(latest);
        setHistoryData(history);
        setRecordsData(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen text-zinc-200">
      <Header
        lastUpdated={latestData?.session?.createdAt || null}
        trending={latestData?.trending || []}
      />

      {/* 에디토리얼 탭 네비 (underline 스타일) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 border-b border-zinc-900">
        <nav className="flex items-center gap-6 sm:gap-10 -mb-px">
          <TabButton active={activeTab === "rankings"} onClick={() => setActiveTab("rankings")}>
            실시간 순위
          </TabButton>
          <TabButton active={activeTab === "graph"} onClick={() => setActiveTab("graph")}>
            순위 변동
          </TabButton>
          <TabButton active={activeTab === "records"} onClick={() => setActiveTab("records")}>
            순위 기록
          </TabButton>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {activeTab === "rankings" && latestData && <TrendingRankings data={latestData} />}
            {activeTab === "graph" && (
              <RankChangeGraph historyData={historyData} trendingData={latestData?.trending || []} />
            )}
            {activeTab === "records" && recordsData && (
              <TrendingRecords data={recordsData} onPageChange={handlePageChange} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative pb-3 text-sm sm:text-base tracking-tight transition-colors
        ${active ? "text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"}
      `}>
      {children}
      <span
        className={`absolute left-0 right-0 -bottom-px h-px transition-colors ${
          active ? "bg-zinc-100" : "bg-transparent"
        }`}
      />
    </button>
  );
}

function LoadingState() {
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
      <div className="space-y-6">
        {/* 1위 히어로 스켈레톤 */}
        <div className="flex gap-6 pb-8 border-b border-zinc-900">
          <div className="h-24 w-24 bg-zinc-900 rounded animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 bg-zinc-900 rounded animate-pulse" />
            <div className="h-4 w-full bg-zinc-900/60 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-zinc-900/60 rounded animate-pulse" />
          </div>
        </div>
        {/* 리스트 */}
        <div className="divide-y divide-zinc-900">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              <div className="h-7 w-10 bg-zinc-900 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-zinc-900 rounded animate-pulse" />
                <div className="h-3 w-56 bg-zinc-900/60 rounded animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-zinc-900/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="space-y-3">
          <div className="h-6 w-32 bg-zinc-900 rounded animate-pulse" />
          <div className="h-3 w-full bg-zinc-900/60 rounded animate-pulse" />
          <div className="h-3 w-4/5 bg-zinc-900/60 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="text-[10px] uppercase tracking-[0.2em] text-rose-400 mb-2">Error</div>
      <p className="text-zinc-400 text-sm max-w-md text-center">{message}</p>
    </div>
  );
}

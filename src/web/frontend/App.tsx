import { useEffect, useState } from "react";

import { fetchLatestTrending, fetchTrendingHistory, fetchTrendingRecords } from "./api";
import Header from "./components/Header";
import RankChangeGraph from "./components/RankChangeGraph";
import TrendingRankings from "./components/TrendingRankings";
import TrendingRecords from "./components/TrendingRecords";
import type { HistoryEntry, LatestTrendingResponse, RecordsResponse } from "./types";

type TabType = "rankings" | "graph" | "records";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("rankings");
  const [latestData, setLatestData] = useState<LatestTrendingResponse | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [recordsData, setRecordsData] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 데이터 로드
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
    // 30초마다 자동 갱신
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Header lastUpdated={latestData?.session?.createdAt || null} />

        {/* 탭 네비게이션 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex gap-2 p-1 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <TabButton
              active={activeTab === "rankings"}
              onClick={() => setActiveTab("rankings")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }>
              실시간 순위
            </TabButton>
            <TabButton
              active={activeTab === "graph"}
              onClick={() => setActiveTab("graph")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              }>
              순위 변동
            </TabButton>
            <TabButton
              active={activeTab === "records"}
              onClick={() => setActiveTab("records")}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }>
              순위 기록
            </TabButton>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function TabButton({ active, onClick, children, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm
        transition-all duration-200 ease-out
        ${
          active
            ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/25"
            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
        }
      `}>
      {icon}
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
      </div>
      <p className="mt-4 text-slate-400 text-sm">데이터를 불러오는 중...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="mt-4 text-red-400 text-sm">{message}</p>
    </div>
  );
}

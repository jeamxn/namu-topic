import type React from "react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface TopKeyword {
  keyword: string;
  count: number;
  avgRank: number;
  minRank: number;
  maxRank: number;
  lastSeen: Date;
}

interface RankStat {
  rank: number;
  keyword: string;
  count: number;
}

interface TrendingUpKeyword {
  keyword: string;
  currentRank: number;
  previousRank: number | null;
  change: number | "new";
  url: string;
}

interface DashboardProps {
  days?: number;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function Dashboard({ days = 7 }: DashboardProps) {
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([]);
  const [rankStats, setRankStats] = useState<RankStat[]>([]);
  const [trendingUp, setTrendingUp] = useState<TrendingUpKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [topRes, rankRes, trendingRes] = await Promise.all([
          fetch(`/api/top-keywords?days=${days}&limit=10`),
          fetch(`/api/rank-statistics?days=${days}`),
          fetch(`/api/trending-up?hours=24&limit=10`),
        ]);

        if (!topRes.ok || !rankRes.ok || !trendingRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [topData, rankData, trendingData] = await Promise.all([
          topRes.json(),
          rankRes.json(),
          trendingRes.json(),
        ]);

        setTopKeywords(topData);
        setRankStats(rankData);
        setTrendingUp(trendingData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, [days]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="mt-4 text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 급상승 키워드 */}
      <section className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
          <h2 className="text-2xl font-bold text-white">🔥 급상승 키워드</h2>
          <span className="text-sm text-slate-400">(최근 24시간)</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trendingUp.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 hover:bg-slate-700/30 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-red-400">#{item.currentRank}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {item.keyword}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.change === "new" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                        <span className="text-lg">✨</span> NEW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {item.change}위 상승
                      </span>
                    )}
                    {item.previousRank && (
                      <span className="text-xs text-slate-500">
                        (이전: #{item.previousRank})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* TOP 키워드 통계 */}
      <section className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-cyan-500 to-violet-500" />
          <h2 className="text-2xl font-bold text-white">📊 인기 키워드 TOP 10</h2>
          <span className="text-sm text-slate-400">(최근 {days}일)</span>
        </div>

        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topKeywords}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="keyword" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                  color: '#f1f5f9'
                }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="count" fill="#06b6d4" name="등장 횟수" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topKeywords.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-cyan-400">#{index + 1}</span>
                <h3 className="text-lg font-bold text-white truncate flex-1">{item.keyword}</h3>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>등장 횟수:</span>
                  <span className="font-semibold text-cyan-400">{item.count}회</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>평균 순위:</span>
                  <span className="font-semibold">{item.avgRank}위</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>최고 순위:</span>
                  <span className="font-semibold text-green-400">{item.minRank}위</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 순위별 통계 */}
      <section className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-violet-500 to-pink-500" />
          <h2 className="text-2xl font-bold text-white">🏆 순위별 최다 등장 키워드</h2>
          <span className="text-sm text-slate-400">(최근 {days}일)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {rankStats.map((item) => (
            <div
              key={item.rank}
              className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center"
            >
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-2">
                #{item.rank}
              </div>
              <h3 className="text-sm font-bold text-white truncate mb-1">{item.keyword}</h3>
              <p className="text-xs text-slate-400">{item.count}회 등장</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 rounded-full bg-slate-700 animate-pulse" />
            <div className="h-8 w-48 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-64 bg-slate-700/30 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

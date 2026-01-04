import { useState } from "react";

import type { LatestTrendingResponse, TrendingItem } from "../types";

interface TrendingRankingsProps {
  data: LatestTrendingResponse;
}

export default function TrendingRankings({ data }: TrendingRankingsProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<TrendingItem | null>(null);

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-amber-400 to-orange-500";
    if (rank === 2) return "from-slate-300 to-slate-400";
    if (rank === 3) return "from-amber-600 to-amber-700";
    return "from-slate-600 to-slate-700";
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank <= 3) {
      return `bg-gradient-to-br ${getRankColor(rank)} text-white shadow-lg`;
    }
    return "bg-slate-800 text-slate-400 border border-slate-700";
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 순위 목록 */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500" />
          실시간 검색어 TOP 10
        </h2>

        {data.trending.length === 0 ? (
          <div className="text-center py-12 text-slate-500">데이터가 없습니다</div>
        ) : (
          <div className="space-y-2">
            {data.trending.slice(0, 10).map((item, index) => (
              <button
                key={item._id}
                onClick={() => setSelectedKeyword(item)}
                className={`
                  w-full group relative overflow-hidden
                  p-4 rounded-xl border transition-all duration-300 text-left
                  ${
                    selectedKeyword?._id === item._id
                      ? "bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}>
                <div className="flex items-center gap-4">
                  {/* 순위 배지 */}
                  <div
                    className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      font-bold text-sm mono ${getRankBadgeStyle(item.rank)}
                    `}>
                    {item.rank}
                  </div>

                  {/* 키워드 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                      {item.keyword}
                    </h3>
                    {item.aiAnalysis?.summary && (
                      <p className="text-sm text-slate-500 truncate mt-0.5">{item.aiAnalysis.summary}</p>
                    )}
                  </div>

                  {/* 카테고리 태그 */}
                  {item.aiAnalysis?.relatedInfo?.category && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {item.aiAnalysis.relatedInfo.category}
                    </span>
                  )}

                  {/* 화살표 */}
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${
                      selectedKeyword?._id === item._id
                        ? "text-cyan-400 rotate-90"
                        : "text-slate-600 group-hover:text-slate-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 상세 정보 패널 */}
      <div className="lg:sticky lg:top-6 h-fit">
        {selectedKeyword ? (
          <KeywordDetail item={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/20 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">키워드를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface KeywordDetailProps {
  item: TrendingItem;
  onClose: () => void;
}

function KeywordDetail({ item, onClose }: KeywordDetailProps) {
  const analysis = item.aiAnalysis;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-6 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-white text-lg mono shadow-lg">
            {item.rank}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{item.keyword}</h2>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1">
              나무위키에서 보기
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {analysis ? (
          <>
            {/* 요약 */}
            {analysis.summary && (
              <Section title="📌 요약" icon="summary">
                <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
              </Section>
            )}

            {/* 실검 이유 */}
            {analysis.reason && (
              <Section title="🔥 실검에 오른 이유" icon="reason">
                <p className="text-slate-300 leading-relaxed">{analysis.reason}</p>
              </Section>
            )}

            {/* 여론 및 반응 */}
            {analysis.publicOpinion && (
              <Section title="💬 여론 및 반응" icon="opinion">
                <p className="text-slate-300 leading-relaxed">{analysis.publicOpinion}</p>
              </Section>
            )}

            {/* 관련 정보 */}
            {analysis.relatedInfo && (
              <Section title="📋 관련 정보" icon="info">
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="분류" value={analysis.relatedInfo.category} />
                  <InfoItem label="관련 인물" value={analysis.relatedInfo.relatedPeople} />
                  <InfoItem label="발생 시점" value={analysis.relatedInfo.occurredAt} />
                  <InfoItem label="관련 키워드" value={analysis.relatedInfo.relatedKeywords} />
                </div>
              </Section>
            )}

            {/* 관련 링크 */}
            {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
              <Section title="🔗 관련 링크" icon="links">
                <div className="space-y-2">
                  {analysis.relatedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                      <div className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                        {link.title}
                      </div>
                      {link.description && (
                        <div className="text-sm text-slate-500 mt-1 line-clamp-2">{link.description}</div>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-slate-700"
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
            <p>AI 분석 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      {children}
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

// UTC 시간을 KST로 변환하는 함수
function formatToKST(value: string): string {
  // "2026-01-04 12:23:18 UTC" 형식 파싱
  const utcMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*UTC$/i);
  if (utcMatch) {
    const dateStr = `${utcMatch[1]}T${utcMatch[2]}Z`;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " KST";
    }
  }
  return value;
}

function InfoItem({ label, value }: InfoItemProps) {
  if (!value || value === "-") return null;

  // 발생 시점인 경우 KST로 변환
  const displayValue = label === "발생 시점" ? formatToKST(value) : value;

  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm text-slate-300 font-medium">{displayValue}</div>
    </div>
  );
}

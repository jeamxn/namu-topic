import dayjs from "dayjs";
import type React from "react";
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
      return `bg-linear-to-br ${getRankColor(rank)} text-white shadow-lg`;
    }
    return "bg-slate-800 text-slate-400 border border-slate-700";
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
      {/* 순위 목록 */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 mb-3 sm:mb-4">
          <span className="w-1.5 h-5 sm:h-6 rounded-full bg-linear-to-b from-cyan-400 to-violet-500" />
          실시간 검색어 TOP 10
        </h2>

        {data.trending.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500 text-sm">데이터가 없습니다</div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {data.trending.slice(0, 10).map((item, index) => (
              <button
                key={item._id}
                onClick={() => setSelectedKeyword(item)}
                className={`
                  w-full group relative overflow-hidden
                  p-3 sm:p-4 rounded-xl border transition-all duration-300 text-left
                  ${
                    selectedKeyword?._id === item._id
                      ? "bg-linear-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                      : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600"
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}>
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* 순위 배지 */}
                  <div
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                      font-bold text-xs sm:text-sm mono shrink-0 ${getRankBadgeStyle(item.rank)}
                    `}>
                    {item.rank}
                  </div>

                  {/* 키워드 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-white truncate group-hover:text-cyan-300 transition-colors">
                      {item.keyword}
                    </h3>
                    {item.aiAnalysis?.summary && (
                      <p className="text-[11px] sm:text-sm text-slate-500 line-clamp-2 sm:truncate mt-0.5">
                        {item.aiAnalysis.summary}
                      </p>
                    )}
                  </div>

                  {/* 카테고리 태그 - 태블릿 이상에서만 표시 */}
                  {item.aiAnalysis?.relatedInfo?.category && (
                    <span className="hidden md:inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                      {item.aiAnalysis.relatedInfo.category}
                    </span>
                  )}

                  {/* 화살표 */}
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 shrink-0 ${
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

      {/* 상세 정보 패널 - 모바일에서는 모달처럼 */}
      {selectedKeyword ? (
        <>
          {/* 모바일: 모달 형태 */}
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedKeyword(null)} />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-h-[80vh] overflow-hidden">
              <KeywordDetail item={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
            </div>
          </div>
          {/* 데스크톱: 사이드 패널 */}
          <div className="hidden lg:block lg:sticky lg:top-6 h-fit">
            <KeywordDetail item={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
          </div>
        </>
      ) : (
        <div className="hidden lg:flex rounded-xl border border-dashed border-slate-700 bg-slate-800/20 p-6 sm:p-8 text-center items-center justify-center">
          <div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">키워드를 클릭하면 상세 정보를 확인할 수 있습니다</p>
          </div>
        </div>
      )}
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
    <div className="rounded-xl border border-slate-700/50 bg-linear-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-4 sm:p-6 border-b border-slate-700/50 bg-linear-to-r from-cyan-500/5 to-violet-500/5">
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 sm:gap-4 pr-10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-white text-base sm:text-lg mono shadow-lg shrink-0">
            {item.rank}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{item.keyword}</h2>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-1">
              나무위키에서 보기
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[50vh] lg:max-h-[600px] overflow-y-auto">
        {analysis ? (
          <>
            {/* 요약 */}
            {analysis.summary && (
              <Section title="📌 요약">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.summary}</p>
              </Section>
            )}

            {/* 실검 이유 */}
            {analysis.reason && (
              <Section title="🔥 실검에 오른 이유">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.reason}</p>
              </Section>
            )}

            {/* 여론 및 반응 */}
            {analysis.publicOpinion && (
              <Section title="💬 여론 및 반응">
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{analysis.publicOpinion}</p>
              </Section>
            )}

            {/* 관련 정보 */}
            {analysis.relatedInfo && (
              <Section title="📋 관련 정보">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <InfoItem label="분류" value={analysis.relatedInfo.category} />
                  <InfoItem label="관련 인물" value={analysis.relatedInfo.relatedPeople} />
                  <InfoItem label="발생 시점" value={analysis.relatedInfo.occurredAt} />
                  <InfoItem label="관련 키워드" value={analysis.relatedInfo.relatedKeywords} />
                </div>
              </Section>
            )}

            {/* 관련 링크 */}
            {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
              <Section title="🔗 관련 링크">
                <div className="space-y-1.5 sm:space-y-2">
                  {analysis.relatedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group">
                      <div className="font-medium text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors truncate">
                        {link.title}
                      </div>
                      {link.description && (
                        <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
                          {link.description}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {/* 관련 이미지 */}
            {analysis.relatedImages && analysis.relatedImages.length > 0 && (
              <Section title="🖼️ 관련 이미지">
                <div className="flex flex-wrap gap-2">
                  {analysis.relatedImages.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/50 hover:bg-slate-800 transition-all group text-xs sm:text-sm">
                      <svg
                        className="w-3.5 h-3.5 text-pink-400 group-hover:text-pink-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-slate-300 group-hover:text-pink-300 transition-colors">
                        {img.description || `이미지 ${idx + 1}`}
                      </span>
                      <svg
                        className="w-3 h-3 text-slate-500 group-hover:text-pink-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : (
          <div className="text-center py-6 sm:py-8 text-slate-500">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-slate-700"
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
            <p className="text-xs sm:text-sm">AI 분석 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="font-semibold text-white text-xs sm:text-sm">{title}</h3>
      {children}
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

// 날짜 포맷 함수
function formatDate(value: string): string {
  // "2026-01-04 12:23:18 UTC" 형식 파싱
  const utcMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*UTC$/i);
  if (utcMatch) {
    const dateStr = `${utcMatch[1]}T${utcMatch[2]}Z`;
    return dayjs(dateStr).format("YYYY. MM. DD. HH:mm:ss");
  }
  // 일반 날짜 문자열
  const parsed = dayjs(value);
  if (parsed.isValid()) {
    return parsed.format("YYYY. MM. DD. HH:mm:ss");
  }
  return value;
}

function InfoItem({ label, value }: InfoItemProps) {
  if (!value || value === "-") return null;

  const displayValue = label === "발생 시점" ? formatDate(value) : value;

  return (
    <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <div className="text-[10px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1">{label}</div>
      <div className="text-xs sm:text-sm text-slate-300 font-medium">{displayValue}</div>
    </div>
  );
}

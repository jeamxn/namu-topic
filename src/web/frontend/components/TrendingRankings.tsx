import dayjs from "dayjs";
import type React from "react";
import { useState } from "react";

import type { LatestTrendingResponse, TrendingItem } from "../types";

interface TrendingRankingsProps {
  data: LatestTrendingResponse;
}

export default function TrendingRankings({ data }: TrendingRankingsProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<TrendingItem | null>(null);

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-zinc-100 text-zinc-900";
    return "bg-zinc-800 text-zinc-400 border border-zinc-700";
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4">
      {/* 순위 목록 */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3 tracking-wide uppercase">
          실시간 검색어 TOP 10
        </h2>

        {data.trending.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">데이터가 없습니다</div>
        ) : (
          <div className="space-y-1.5">
            {data.trending.slice(0, 10).map((item) => (
              <button
                key={item._id}
                onClick={() => setSelectedKeyword(item)}
                className={`
                  w-full group p-3 sm:p-4 rounded-lg border transition-colors duration-150 text-left
                  ${
                    selectedKeyword?._id === item._id
                      ? "bg-zinc-900 border-zinc-700"
                      : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                  }
                `}>
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* 순위 배지 */}
                  <div
                    className={`
                      w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center
                      font-semibold text-xs sm:text-sm mono shrink-0 ${getRankBadgeStyle(item.rank)}
                    `}>
                    {item.rank}
                  </div>

                  {/* 키워드 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-zinc-100 truncate">
                      {item.keyword}
                    </h3>
                    {item.aiAnalysis?.summary && (
                      <p className="text-[11px] sm:text-sm text-zinc-500 line-clamp-2 sm:truncate mt-0.5">
                        {item.aiAnalysis.summary}
                      </p>
                    )}
                  </div>

                  {/* 카테고리 태그 */}
                  {item.aiAnalysis?.relatedInfo?.category && (
                    <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                      {item.aiAnalysis.relatedInfo.category}
                    </span>
                  )}

                  {/* 화살표 */}
                  <svg
                    className={`w-4 h-4 transition-transform duration-150 shrink-0 ${
                      selectedKeyword?._id === item._id
                        ? "text-zinc-300 rotate-90"
                        : "text-zinc-600 group-hover:text-zinc-400"
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
      {selectedKeyword ? (
        <>
          {/* 모바일: 모달 */}
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedKeyword(null)} />
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
        <div className="hidden lg:flex rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center items-center justify-center">
          <div>
            <svg
              className="w-8 h-8 text-zinc-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-zinc-500 text-sm">키워드를 선택하면 상세 정보가 표시됩니다</p>
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* 헤더 */}
      <div className="relative p-4 sm:p-5 border-b border-zinc-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 sm:gap-4 pr-10">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center font-semibold text-zinc-100 text-base mono shrink-0">
            {item.rank}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">{item.keyword}</h2>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 mt-1">
              나무위키에서 보기
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="p-4 sm:p-5 space-y-5 max-h-[50vh] lg:max-h-[600px] overflow-y-auto">
        {analysis ? (
          <>
            {analysis.summary && (
              <Section title="요약">
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.summary}</p>
              </Section>
            )}

            {analysis.reason && (
              <Section title="실검에 오른 이유">
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.reason}</p>
              </Section>
            )}

            {analysis.publicOpinion && (
              <Section title="여론 및 반응">
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{analysis.publicOpinion}</p>
              </Section>
            )}

            {analysis.relatedInfo && (
              <Section title="관련 정보">
                <div className="grid grid-cols-2 gap-2">
                  <InfoItem label="분류" value={analysis.relatedInfo.category} />
                  <InfoItem label="관련 인물" value={analysis.relatedInfo.relatedPeople} />
                  <InfoItem label="발생 시점" value={analysis.relatedInfo.occurredAt} />
                  <InfoItem label="관련 키워드" value={analysis.relatedInfo.relatedKeywords} />
                </div>
              </Section>
            )}

            {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
              <Section title="관련 링크">
                <div className="space-y-1.5">
                  {analysis.relatedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors group">
                      <div className="font-medium text-zinc-200 text-xs sm:text-sm group-hover:text-blue-400 transition-colors truncate">
                        {link.title}
                      </div>
                      {link.description && (
                        <div className="text-[11px] sm:text-xs text-zinc-500 mt-1 line-clamp-2">
                          {link.description}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {analysis.relatedImages && analysis.relatedImages.length > 0 && (
              <Section title="관련 이미지">
                <div className="flex flex-wrap gap-1.5">
                  {analysis.relatedImages.map((img, idx) => (
                    <a
                      key={idx}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group text-xs">
                      <svg
                        className="w-3.5 h-3.5 text-zinc-500"
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
                      <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors">
                        {img.description || `이미지 ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-zinc-500">
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
    <div className="space-y-2">
      <h3 className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wide">{title}</h3>
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
  const utcMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*UTC$/i);
  if (utcMatch) {
    const dateStr = `${utcMatch[1]}T${utcMatch[2]}Z`;
    return dayjs(dateStr).format("YYYY. MM. DD. HH:mm:ss");
  }
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
    <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800">
      <div className="text-[10px] text-zinc-500 mb-1">{label}</div>
      <div className="text-xs sm:text-sm text-zinc-200">{displayValue}</div>
    </div>
  );
}

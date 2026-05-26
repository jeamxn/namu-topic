import dayjs from "dayjs";
import type React from "react";
import { useState } from "react";

import type { LatestTrendingResponse, TrendingItem } from "../types";

interface TrendingRankingsProps {
  data: LatestTrendingResponse;
}

// 카테고리 → 컬러 매핑 (단일 액센트 톤다운)
type CategoryTone = {
  dot: string;
  text: string;
};

function getCategoryTone(rawCategory?: string): CategoryTone {
  const c = (rawCategory || "").toLowerCase();
  if (/정치|사회|시사/.test(rawCategory || "")) return { dot: "bg-rose-400", text: "text-rose-400" };
  if (/연예|엔터|방송|드라마|영화|음악/.test(rawCategory || ""))
    return { dot: "bg-violet-400", text: "text-violet-400" };
  if (/스포츠|야구|축구|농구|배구|골프|e스포츠/.test(rawCategory || ""))
    return { dot: "bg-emerald-400", text: "text-emerald-400" };
  if (/it|게임|기술|테크|ai/.test(c)) return { dot: "bg-blue-400", text: "text-blue-400" };
  if (/경제|금융|증시|주식|부동산/.test(rawCategory || ""))
    return { dot: "bg-amber-400", text: "text-amber-400" };
  if (/인물|배우|가수|아이돌|선수/.test(rawCategory || ""))
    return { dot: "bg-sky-400", text: "text-sky-400" };
  return { dot: "bg-zinc-500", text: "text-zinc-500" };
}

export default function TrendingRankings({ data }: TrendingRankingsProps) {
  const top = data.trending.slice(0, 10);
  const hero = top[0] || null;
  const rest = top.slice(1);

  const [selectedKeyword, setSelectedKeyword] = useState<TrendingItem | null>(hero);

  if (top.length === 0) {
    return <div className="text-center py-16 text-zinc-500 text-sm">데이터가 없습니다</div>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
      {/* 좌측: 히어로 + 리스트 */}
      <div>
        {/* (A) 히어로 — #1 */}
        {hero && <HeroFeature item={hero} onClick={() => setSelectedKeyword(hero)} active={selectedKeyword?._id === hero._id} />}

        {/* 섹션 라벨 */}
        <div className="flex items-baseline justify-between mt-10 mb-2 pb-3 border-b border-zinc-200 dark:border-zinc-900">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">More Trending</span>
          <span className="mono tabular text-[10px] text-zinc-400 dark:text-zinc-600">02 — {String(top.length).padStart(2, "0")}</span>
        </div>

        {/* (B) 2-10위 리스트 — 디바이더만 */}
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-900">
          {rest.map((item) => {
            const tone = getCategoryTone(item.aiAnalysis?.relatedInfo?.category);
            const isSelected = selectedKeyword?._id === item._id;
            return (
              <li key={item._id}>
                <button
                  onClick={() => setSelectedKeyword(item)}
                  className={`group w-full text-left grid grid-cols-[56px_1fr_auto] sm:grid-cols-[72px_1fr_auto] items-center gap-3 sm:gap-5 py-4 sm:py-5 transition-colors ${
                    isSelected
                      ? "bg-zinc-100/60 dark:bg-zinc-900/40 border-l border-zinc-900 dark:border-zinc-100 pl-3 -ml-3"
                      : "hover:bg-zinc-100/60 dark:hover:bg-zinc-900/30"
                  }`}>
                  {/* 큰 모노 숫자 */}
                  <span
                    className={`mono tabular font-bold text-2xl sm:text-3xl ${
                      isSelected
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                    } transition-colors`}>
                    {String(item.rank).padStart(2, "0")}
                  </span>

                  {/* 키워드 + 요약 */}
                  <div className="min-w-0">
                    <h3 className="font-display text-base sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                      {item.keyword}
                    </h3>
                    {item.aiAnalysis?.summary && (
                      <p className="text-xs sm:text-sm text-zinc-500 line-clamp-1 mt-0.5">
                        {item.aiAnalysis.summary}
                      </p>
                    )}
                  </div>

                  {/* 카테고리 */}
                  {item.aiAnalysis?.relatedInfo?.category &&
                    item.aiAnalysis.relatedInfo.category !== "-" && (
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                          {item.aiAnalysis.relatedInfo.category}
                        </span>
                      </div>
                    )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 우측: 상세 패널 */}
      {selectedKeyword ? (
        <>
          {/* 모바일: 모달 */}
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/80" onClick={() => setSelectedKeyword(null)} />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-h-[85vh] overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900">
              <KeywordDetail item={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
            </div>
          </div>
          {/* 데스크탑: 사이드 패널 */}
          <aside className="hidden lg:block lg:sticky lg:top-32 h-fit max-h-[calc(100vh-9rem)] overflow-y-auto pl-8 border-l border-zinc-200 dark:border-zinc-900">
            <KeywordDetail item={selectedKeyword} onClose={() => setSelectedKeyword(null)} embedded />
          </aside>
        </>
      ) : (
        <aside className="hidden lg:block pl-8 border-l border-zinc-200 dark:border-zinc-900">
          <p className="text-zinc-400 dark:text-zinc-600 text-sm">키워드를 선택하면 상세 정보가 표시됩니다.</p>
        </aside>
      )}
    </div>
  );
}

/* ----------------------------- Hero ----------------------------- */

interface HeroProps {
  item: TrendingItem;
  onClick: () => void;
  active: boolean;
}

function HeroFeature({ item, onClick, active }: HeroProps) {
  const analysis = item.aiAnalysis;
  const tone = getCategoryTone(analysis?.relatedInfo?.category);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left block pb-8 sm:pb-10 border-b border-zinc-200 dark:border-zinc-900">
      {/* 메타 라인 */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Top Story</span>
        {analysis?.relatedInfo?.category && analysis.relatedInfo.category !== "-" && (
          <>
            <span className="text-zinc-300 dark:text-zinc-800">·</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                {analysis.relatedInfo.category}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-start gap-5 sm:gap-8">
        {/* 거대 모노 숫자 */}
        <span className="mono tabular font-black text-6xl sm:text-8xl lg:text-9xl leading-none text-zinc-900 dark:text-zinc-100 shrink-0">
          01
        </span>

        {/* 키워드 + 요약 */}
        <div className="flex-1 min-w-0 pt-1 sm:pt-3">
          <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.05]">
            {item.keyword}
          </h2>
          {analysis?.summary && (
            <p className="mt-3 sm:mt-4 text-base sm:text-xl text-zinc-600 dark:text-zinc-400 leading-snug max-w-2xl line-clamp-3">
              {analysis.summary}
            </p>
          )}

          {/* 메타데이터 inline */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-zinc-500">
            {analysis?.relatedInfo?.occurredAt && analysis.relatedInfo.occurredAt !== "-" && (
              <span className="mono tabular">{formatDate(analysis.relatedInfo.occurredAt)}</span>
            )}
            {analysis?.relatedInfo?.relatedPeople && analysis.relatedInfo.relatedPeople !== "-" && (
              <span>
                <span className="text-zinc-400 dark:text-zinc-600">관련 인물 · </span>
                <span className="text-zinc-700 dark:text-zinc-300">{analysis.relatedInfo.relatedPeople}</span>
              </span>
            )}
            <span
              className={`ml-auto text-[11px] uppercase tracking-wider transition-colors ${
                active ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
              }`}>
              자세히 →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ----------------------------- Detail ----------------------------- */

interface KeywordDetailProps {
  item: TrendingItem;
  onClose: () => void;
  embedded?: boolean;
}

function KeywordDetail({ item, onClose, embedded = false }: KeywordDetailProps) {
  const analysis = item.aiAnalysis;
  const tone = getCategoryTone(analysis?.relatedInfo?.category);

  return (
    <div className={embedded ? "" : "p-5"}>
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 pb-5 border-b border-zinc-200 dark:border-zinc-900">
        <div className="flex items-baseline gap-4 min-w-0">
          <span className="mono tabular font-light text-3xl sm:text-4xl text-zinc-300 dark:text-zinc-700 leading-none">
            {String(item.rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {item.keyword}
            </h2>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              나무위키
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

        {!embedded && (
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 카테고리 inline */}
      {analysis?.relatedInfo?.category && analysis.relatedInfo.category !== "-" && (
        <div className="flex items-center gap-2 mt-4">
          <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {analysis.relatedInfo.category}
          </span>
        </div>
      )}

      {/* 컨텐츠 */}
      <div className={`mt-6 space-y-7 ${embedded ? "" : "max-h-[55vh] overflow-y-auto"}`}>
        {analysis ? (
          <>
            {analysis.summary && (
              <Section title="요약">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{analysis.summary}</p>
              </Section>
            )}

            {analysis.reason && (
              <Section title="실검 사유">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{analysis.reason}</p>
              </Section>
            )}

            {analysis.publicOpinion && (
              <Section title="여론">
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{analysis.publicOpinion}</p>
              </Section>
            )}

            {analysis.relatedInfo && (
              <Section title="관련 정보">
                <dl className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  <DefRow label="분류" value={analysis.relatedInfo.category} />
                  <DefRow label="관련 인물" value={analysis.relatedInfo.relatedPeople} />
                  <DefRow
                    label="발생 시점"
                    value={
                      analysis.relatedInfo.occurredAt && analysis.relatedInfo.occurredAt !== "-"
                        ? formatDate(analysis.relatedInfo.occurredAt)
                        : ""
                    }
                  />
                  <DefRow label="관련 키워드" value={analysis.relatedInfo.relatedKeywords} />
                </dl>
              </Section>
            )}

            {analysis.relatedLinks && analysis.relatedLinks.length > 0 && (
              <Section title="관련 링크">
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  {analysis.relatedLinks.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block py-3">
                        <div className="text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors leading-snug">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                            {link.description}
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {analysis.relatedImages && analysis.relatedImages.length > 0 && (
              <Section title="관련 이미지">
                <ul className="space-y-1.5">
                  {analysis.relatedImages.map((img, idx) => (
                    <li key={idx}>
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        <span className="text-zinc-300 dark:text-zinc-700">↗</span>
                        <span>{img.description || `이미지 ${idx + 1}`}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        ) : (
          <p className="text-sm text-zinc-500 py-8 text-center">AI 분석 결과가 없습니다</p>
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
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function DefRow({ label, value }: { label: string; value: string }) {
  if (!value || value === "-") return null;
  return (
    <div className="flex items-start gap-4 py-2.5">
      <dt className="w-20 shrink-0 text-[11px] uppercase tracking-wider text-zinc-500 pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  );
}

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

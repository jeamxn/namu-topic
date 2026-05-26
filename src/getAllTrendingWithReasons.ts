import { getSearchReasonDetail } from "./getSearchReason";
import getTrendingKeywords, { getNamuwikiContent } from "./getTrendingKeywords";
import { summarizeRelatedDocs } from "./summarizeRelatedDoc";
import type { TrendingWithReason } from "./types";

const getAllTrendingWithReasons = async (): Promise<TrendingWithReason[]> => {
  // 1. 실시간 검색어 가져오기
  console.log("📊 나무위키 실시간 검색어 가져오는 중...\n");
  const trendingKeywords = await getTrendingKeywords();
  const top10 = trendingKeywords.slice(0, 10);

  // 2. 각 검색어의 실검 이유 + 나무위키 본문 + 관련 문서 요약
  const results: TrendingWithReason[] = [];

  for (const item of top10) {
    const [reason, namuwiki] = await Promise.all([
      getSearchReasonDetail(item.keyword),
      getNamuwikiContent(item.url),
    ]);

    // Stage 1: 관련 문서 요약 (있을 때만)
    let relatedSummaries: Array<{ title: string; url: string; summary: string }> = [];
    if (namuwiki.relatedLinks.length > 0) {
      console.log(`🔗 [${item.rank}위 ${item.keyword}] 관련 문서 ${namuwiki.relatedLinks.length}개 요약 중...`);
      try {
        relatedSummaries = await summarizeRelatedDocs(namuwiki.relatedLinks);
      } catch (err) {
        console.log(`⚠️ [${item.keyword}] 관련 문서 요약 단계 실패:`, (err as Error).message);
      }
    }

    results.push({
      rank: item.rank,
      keyword: item.keyword,
      url: item.url,
      reason,
      namuwikiContent: namuwiki.content,
      namuwikiRelated: relatedSummaries,
    });
  }

  return results;
};

export default getAllTrendingWithReasons;

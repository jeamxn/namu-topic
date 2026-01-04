import { getSearchReasonDetail } from "./getSearchReason";
import getTrendingKeywords from "./getTrendingKeywords";
import type { TrendingWithReason } from "./types";

/**
 * 모든 실시간 검색어의 실검 이유를 가져오는 함수
 */
const getAllTrendingWithReasons = async (): Promise<TrendingWithReason[]> => {
  // 1. 실시간 검색어 가져오기
  console.log("📊 나무위키 실시간 검색어 가져오는 중...\n");
  const trendingKeywords = await getTrendingKeywords();
  const top10 = trendingKeywords.slice(0, 10);

  // 2. 각 검색어의 실검 이유 가져오기
  const results: TrendingWithReason[] = [];

  for (const item of top10) {
    const reason = await getSearchReasonDetail(item.keyword);
    results.push({
      rank: item.rank,
      keyword: item.keyword,
      url: item.url,
      reason,
    });
  }

  return results;
};

const results = await getAllTrendingWithReasons();
const file = Bun.file("results.json");
await file.write(JSON.stringify(results, null, 2));
console.log(results);

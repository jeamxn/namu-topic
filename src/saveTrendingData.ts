import type { ObjectId } from "mongodb";
import { getDB } from "./mongodb";
import type { TrendingDocument, TrendingWithReason } from "./types";

const COLLECTION_NAME = "trending_snapshots";

// 순위별 저장된 문서의 ID 매핑
export interface SavedTrendingResult {
  rank: number;
  keyword: string;
  insertedId: ObjectId;
}

export const saveTrendingData = async (
  trendingData: TrendingWithReason[],
  crawlSessionId: ObjectId,
): Promise<SavedTrendingResult[]> => {
  const db = getDB();
  const collection = db.collection<TrendingDocument>(COLLECTION_NAME);

  // 각 순위별로 개별 문서로 저장 (rank, keyword, url만 저장)
  const documents: TrendingDocument[] = trendingData.map((item) => ({
    crawlSessionId,
    rank: item.rank,
    keyword: item.keyword,
    url: item.url,
  }));

  const result = await collection.insertMany(documents);
  console.log(`💾 trending_snapshots 저장 완료 (${result.insertedCount}개 문서)`);

  // 순위별 insertedId 매핑 반환
  return trendingData
    .map((item, index) => {
      const insertedId = result.insertedIds[index];
      if (!insertedId) return null;
      return {
        rank: item.rank,
        keyword: item.keyword,
        insertedId,
      };
    })
    .filter((item): item is SavedTrendingResult => item !== null);
};

export default saveTrendingData;

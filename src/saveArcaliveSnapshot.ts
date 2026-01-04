import { getDB } from "./mongodb";
import type { SavedTrendingResult } from "./saveTrendingData";
import type { ArcaliveSnapshotDocument, TrendingWithReason } from "./types";

const COLLECTION_NAME = "arcalive_snapshots";

export const saveArcaliveSnapshot = async (
  trendingData: TrendingWithReason[],
  savedTrending: SavedTrendingResult[],
): Promise<void> => {
  const db = getDB();
  const collection = db.collection<ArcaliveSnapshotDocument>(COLLECTION_NAME);

  // reason이 있는 항목만 저장
  const documents: ArcaliveSnapshotDocument[] = trendingData
    .map((item) => {
      if (!item.reason) return null;

      const trending = savedTrending.find((t) => t.rank === item.rank);
      if (!trending) return null;

      return {
        trendingSnapshotId: trending.insertedId,
        postDetail: item.reason,
      };
    })
    .filter((doc): doc is ArcaliveSnapshotDocument => doc !== null);

  if (documents.length === 0) {
    console.log("⚠️ 저장할 아카라이브 스냅샷이 없습니다.");
    return;
  }

  const result = await collection.insertMany(documents);
  console.log(`💾 arcalive_snapshots 저장 완료 (${result.insertedCount}개 문서)`);
};

export default saveArcaliveSnapshot;


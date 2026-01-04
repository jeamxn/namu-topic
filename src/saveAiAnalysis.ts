import { getDB } from "./mongodb";
import type { SavedTrendingResult } from "./saveTrendingData";
import type { AiAnalysisDocument, ParsedAiAnalysis } from "./types";

const COLLECTION_NAME = "ai_analyses";

export const saveAiAnalysis = async (
  analyses: ParsedAiAnalysis[],
  savedTrending: SavedTrendingResult[],
): Promise<void> => {
  const db = getDB();
  const collection = db.collection<AiAnalysisDocument>(COLLECTION_NAME);

  // 순위별로 trending_snapshots._id와 매칭하여 저장 (createdAt, rank 제외)
  const documents: AiAnalysisDocument[] = analyses
    .map((analysis) => {
      const trending = savedTrending.find((t) => t.rank === analysis.rank);
      if (!trending) return null;

      return {
        trendingSnapshotId: trending.insertedId,
        keyword: analysis.keyword,
        summary: analysis.summary,
        reason: analysis.reason,
        publicOpinion: analysis.publicOpinion,
        relatedInfo: analysis.relatedInfo,
        relatedLinks: analysis.relatedLinks,
        relatedImages: analysis.relatedImages,
      };
    })
    .filter((doc): doc is AiAnalysisDocument => doc !== null);

  if (documents.length === 0) {
    console.log("⚠️ 저장할 AI 분석 결과가 없습니다.");
    return;
  }

  const result = await collection.insertMany(documents);
  console.log(`💾 ai_analyses 저장 완료 (${result.insertedCount}개 문서)`);
};

export default saveAiAnalysis;

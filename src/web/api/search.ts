import type { Db } from "mongodb";

// 키워드 검색 - 전체 히스토리 조회
export const searchKeyword = async (db: Db, keyword: string, limit = 50) => {
  // 해당 키워드가 포함된 모든 트렌딩 데이터 조회
  const trending = await db
    .collection("trending_snapshots")
    .find({ keyword: { $regex: keyword, $options: "i" } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  if (trending.length === 0) {
    return [];
  }

  // 크롤 세션 정보 조회
  const sessionIds = [...new Set(trending.map((t) => t.crawlSessionId))];
  const sessions = await db
    .collection("crawl_sessions")
    .find({ _id: { $in: sessionIds } })
    .toArray();

  // AI 분석 결과 조회
  const trendingIds = trending.map((t) => t._id);
  const aiAnalyses = await db
    .collection("ai_analyses")
    .find({ trendingSnapshotId: { $in: trendingIds } })
    .toArray();

  // 데이터 병합
  const results = trending.map((t) => {
    const session = sessions.find((s) => s._id.toString() === t.crawlSessionId.toString());
    const analysis = aiAnalyses.find((a) => a.trendingSnapshotId.toString() === t._id.toString());

    return {
      keyword: t.keyword,
      rank: t.rank,
      url: t.url,
      timestamp: session?.createdAt || null,
      sessionId: t.crawlSessionId,
      aiAnalysis: analysis || null,
    };
  });

  return results;
};

// 키워드 통계 - 가장 자주 등장한 키워드 TOP N
export const getTopKeywords = async (db: Db, days = 7, limit = 20) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // 최근 N일간의 크롤 세션 조회
  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true, createdAt: { $gte: since } })
    .toArray();

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => s._id);

  // 키워드별 등장 횟수와 평균 순위 집계
  const aggregation = await db
    .collection("trending_snapshots")
    .aggregate([
      { $match: { crawlSessionId: { $in: sessionIds } } },
      {
        $group: {
          _id: "$keyword",
          count: { $sum: 1 },
          avgRank: { $avg: "$rank" },
          minRank: { $min: "$rank" },
          maxRank: { $max: "$rank" },
          lastSeen: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    .toArray();

  return aggregation.map((item) => ({
    keyword: item._id,
    count: item.count,
    avgRank: Math.round(item.avgRank * 10) / 10,
    minRank: item.minRank,
    maxRank: item.maxRank,
    lastSeen: item.lastSeen,
  }));
};

// 순위별 통계 - 각 순위에 가장 오래 머문 키워드
export const getRankStatistics = async (db: Db, days = 7) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true, createdAt: { $gte: since } })
    .toArray();

  if (sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => s._id);

  // 순위별로 가장 많이 등장한 키워드 집계
  const stats = [];
  for (let rank = 1; rank <= 10; rank++) {
    const aggregation = await db
      .collection("trending_snapshots")
      .aggregate([
        { $match: { crawlSessionId: { $in: sessionIds }, rank } },
        {
          $group: {
            _id: "$keyword",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ])
      .toArray();

    if (aggregation.length > 0) {
      stats.push({
        rank,
        keyword: aggregation[0]._id,
        count: aggregation[0].count,
      });
    }
  }

  return stats;
};

// 트렌드 분석 - 최근 급상승 키워드
export const getTrendingUpKeywords = async (db: Db, hours = 24, limit = 10) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // 최근 시간 범위의 세션 조회
  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true, createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .toArray();

  if (sessions.length < 2) {
    return [];
  }

  // 최신 세션과 이전 세션들의 키워드 비교
  const latestSession = sessions[0];
  const previousSessions = sessions.slice(1, Math.min(6, sessions.length)); // 최근 5개 세션

  const latestTrending = await db
    .collection("trending_snapshots")
    .find({ crawlSessionId: latestSession._id })
    .toArray();

  const previousSessionIds = previousSessions.map((s) => s._id);
  const previousTrending = await db
    .collection("trending_snapshots")
    .find({ crawlSessionId: { $in: previousSessionIds } })
    .toArray();

  // 새로 등장한 키워드 또는 순위가 크게 상승한 키워드 찾기
  const trendingUp = [];
  for (const latest of latestTrending) {
    const previous = previousTrending.filter((p) => p.keyword === latest.keyword);

    if (previous.length === 0) {
      // 새로 등장한 키워드
      trendingUp.push({
        keyword: latest.keyword,
        currentRank: latest.rank,
        previousRank: null,
        change: "new",
        url: latest.url,
      });
    } else {
      // 순위 변동 계산
      const avgPreviousRank = previous.reduce((sum, p) => sum + p.rank, 0) / previous.length;
      const rankChange = avgPreviousRank - latest.rank;

      if (rankChange > 0) {
        // 순위 상승
        trendingUp.push({
          keyword: latest.keyword,
          currentRank: latest.rank,
          previousRank: Math.round(avgPreviousRank),
          change: Math.round(rankChange),
          url: latest.url,
        });
      }
    }
  }

  // 순위 변동이 큰 순으로 정렬
  trendingUp.sort((a, b) => {
    if (a.change === "new") return -1;
    if (b.change === "new") return 1;
    return (b.change as number) - (a.change as number);
  });

  return trendingUp.slice(0, limit);
};

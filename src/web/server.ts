import { serve } from "bun";
import type { Db } from "mongodb";

import { getDB } from "../mongodb";
import homepage from "./public/index.html";
import log from "../logger";

// API 응답 헬퍼
const json = (data: unknown, status = 200) => {
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

const error = (message: string, status = 400) => {
  return json({ error: message }, status);
};

// 최신 트렌딩 데이터 조회
const getLatestTrending = async (db: Db) => {
  // 최신 크롤 세션 조회
  const latestSession = await db.collection("crawl_sessions").findOne({ done: true }, { sort: { createdAt: -1 } });

  if (!latestSession) {
    return { trending: [], aiAnalysis: [], session: null };
  }

  // 해당 세션의 트렌딩 데이터 조회
  const trending = await db
    .collection("trending_snapshots")
    .find({ crawlSessionId: latestSession._id })
    .sort({ rank: 1 })
    .toArray();

  // AI 분석 결과 조회
  const trendingIds = trending.map((t) => t._id);
  const aiAnalysis = await db
    .collection("ai_analyses")
    .find({ trendingSnapshotId: { $in: trendingIds } })
    .toArray();

  // 트렌딩과 AI 분석 결과 병합
  const mergedData = trending.map((t) => {
    const analysis = aiAnalysis.find((a) => a.trendingSnapshotId.toString() === t._id.toString());
    return {
      ...t,
      aiAnalysis: analysis || null,
    };
  });

  return {
    trending: mergedData,
    session: latestSession,
  };
};

// 트렌딩 히스토리 조회 (최근 24시간)
const getTrendingHistory = async (db: Db, hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // 최근 크롤 세션들 조회
  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true, createdAt: { $gte: since } })
    .sort({ createdAt: 1 })
    .toArray();

  if (sessions.length === 0) {
    return [];
  }

  // 각 세션의 트렌딩 데이터 조회
  const history = [];
  for (const session of sessions) {
    const trending = await db
      .collection("trending_snapshots")
      .find({ crawlSessionId: session._id })
      .sort({ rank: 1 })
      .toArray();

    history.push({
      timestamp: session.createdAt,
      sessionId: session._id,
      keywords: trending.map((t) => ({
        rank: t.rank,
        keyword: t.keyword,
      })),
    });
  }

  return history;
};

// 특정 키워드의 순위 변동 조회
const getKeywordRankHistory = async (db: Db, keyword: string, hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true, createdAt: { $gte: since } })
    .sort({ createdAt: 1 })
    .toArray();

  const rankHistory = [];
  for (const session of sessions) {
    const trending = await db.collection("trending_snapshots").findOne({ crawlSessionId: session._id, keyword });

    rankHistory.push({
      timestamp: session.createdAt,
      rank: trending ? trending.rank : null,
    });
  }

  return rankHistory;
};

// 순위 기록 조회 (페이지네이션)
const getTrendingRecords = async (db: Db, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const sessions = await db
    .collection("crawl_sessions")
    .find({ done: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection("crawl_sessions").countDocuments({ done: true });

  const records = [];
  for (const session of sessions) {
    const trending = await db
      .collection("trending_snapshots")
      .find({ crawlSessionId: session._id })
      .sort({ rank: 1 })
      .limit(10)
      .toArray();

    records.push({
      sessionId: session._id,
      timestamp: session.createdAt,
      keywords: trending.map((t) => ({
        rank: t.rank,
        keyword: t.keyword,
      })),
    });
  }

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 웹 서버 시작 함수
export const startWebServer = (port = 3000) => {
  const db = getDB();

  const server = serve({
    port,
    routes: {
      "/": homepage,

      // 최신 트렌딩 데이터 API
      "/api/trending/latest": {
        async GET() {
          try {
            const data = await getLatestTrending(db);
            return json(data);
          } catch (err) {
            log.error("web", "Error fetching latest trending", err);
            return error("트렌딩 데이터를 가져오는데 실패했습니다.", 500);
          }
        },
      },

      // 트렌딩 히스토리 API (그래프용)
      "/api/trending/history": {
        async GET(req) {
          try {
            const url = new URL(req.url);
            const hours = parseInt(url.searchParams.get("hours") || "24", 10);
            const data = await getTrendingHistory(db, hours);
            return json(data);
          } catch (err) {
            log.error("web", "Error fetching trending history", err);
            return error("히스토리 데이터를 가져오는데 실패했습니다.", 500);
          }
        },
      },

      // 특정 키워드 순위 변동 API
      "/api/trending/keyword/:keyword": async (req) => {
        try {
          const keyword = decodeURIComponent(req.params.keyword);
          const url = new URL(req.url);
          const hours = parseInt(url.searchParams.get("hours") || "24", 10);
          const data = await getKeywordRankHistory(db, keyword, hours);
          return json(data);
        } catch (err) {
          log.error("web", "Error fetching keyword history", err);
          return error("키워드 히스토리를 가져오는데 실패했습니다.", 500);
        }
      },

      // 순위 기록 API (페이지네이션)
      "/api/trending/records": {
        async GET(req) {
          try {
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get("page") || "1", 10);
            const limit = parseInt(url.searchParams.get("limit") || "20", 10);
            const data = await getTrendingRecords(db, page, limit);
            return json(data);
          } catch (err) {
            log.error("web", "Error fetching trending records", err);
            return error("기록 데이터를 가져오는데 실패했습니다.", 500);
          }
        },
      },

      // 특정 세션의 키워드 상세 정보 API
      "/api/trending/keyword-detail": {
        async GET(req) {
          try {
            const url = new URL(req.url);
            const sessionId = url.searchParams.get("sessionId");
            const keyword = url.searchParams.get("keyword");

            if (!sessionId || !keyword) {
              return error("sessionId와 keyword가 필요합니다.", 400);
            }

            // 해당 세션의 트렌딩 데이터 조회
            const { ObjectId } = await import("mongodb");
            const trending = await db.collection("trending_snapshots").findOne({
              crawlSessionId: new ObjectId(sessionId),
              keyword: keyword,
            });

            if (!trending) {
              return json({ trending: null, aiAnalysis: null });
            }

            // AI 분석 결과 조회
            const aiAnalysis = await db.collection("ai_analyses").findOne({
              trendingSnapshotId: trending._id,
            });

            return json({
              trending: {
                _id: trending._id,
                rank: trending.rank,
                keyword: trending.keyword,
                url: trending.url,
              },
              aiAnalysis: aiAnalysis || null,
            });
          } catch (err) {
            log.error("web", "Error fetching keyword detail", err);
            return error("키워드 상세 정보를 가져오는데 실패했습니다.", 500);
          }
        },
      },
    },

    // 개발 환경에서만 HMR 활성화 (프로덕션에서는 jsx_dev_runtime 에러 방지)
    development: process.env.NODE_ENV !== "production" && {
      hmr: true,
      console: true,
    },

    fetch(req) {
      // CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  });

  log.ok("web", `웹 대시보드 서버 시작: ${server.url}`);
  return server;
};

export default startWebServer;

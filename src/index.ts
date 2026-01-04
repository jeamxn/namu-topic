import { Queue, Worker } from "bullmq";

import getAiData from "./getAiData";
import getAllTrendingWithReasons from "./getAllTrendingWithReasons";
import { closeDB, connectDB } from "./mongodb";
import saveAiAnalysis from "./saveAiAnalysis";
import saveArcaliveSnapshot from "./saveArcaliveSnapshot";
import saveCrawlSession, { updateCrawlSessionDone } from "./saveCrawlSession";
import saveTrendingData from "./saveTrendingData";
import startWebServer from "./web/server";

const QUEUE_NAME = "namu-topic-trending";
const JOB_NAME = "collect-trending";

const redisConnection = {
  host: Bun.env.REDIS_HOST || "redis",
  port: Number(Bun.env.REDIS_PORT) || 6379,
};

// 작업 처리 함수
const processJob = async (): Promise<void> => {
  const startTime = new Date();
  console.log(`\n🕐 [${startTime.toLocaleString("ko-KR")}] 작업 시작...`);

  try {
    // 1. 크롤 세션 생성 (사이클마다 고유 문서)
    const crawlSessionId = await saveCrawlSession();

    // 2. 실시간 검색어 + 이유 수집
    const results = await getAllTrendingWithReasons();

    // 3. trending_snapshots에 저장 (rank, keyword, url만 저장)
    const savedTrending = await saveTrendingData(results, crawlSessionId);

    // 4. arcalive_snapshots에 저장 (reason 데이터 별도 저장)
    await saveArcaliveSnapshot(results, savedTrending);

    // 5. AI 분석 실행 (순위별 파싱)
    const aiAnalyses = await getAiData(results);
    console.log(JSON.stringify(aiAnalyses, null, 2));

    // 6. ai_analyses에 저장 (trending_snapshots._id와 FK 연결, rank 제외)
    await saveAiAnalysis(aiAnalyses, savedTrending);

    // 7. 크롤 세션 완료 처리
    await updateCrawlSessionDone(crawlSessionId);

    console.log(`✅ [${new Date().toLocaleString("ko-KR")}] 작업 완료!`);
  } catch (error) {
    console.error(`❌ [${new Date().toLocaleString("ko-KR")}] 작업 실패:`, error);
    throw error; // BullMQ가 재시도할 수 있도록 에러 던지기
  }
};

const main = async (): Promise<void> => {
  console.log("🚀 나무위키 실시간 검색어 수집기 시작");
  console.log(`📡 Redis 연결: ${redisConnection.host}:${redisConnection.port}`);
  console.log(`⏰ 10분 간격으로 실행됩니다.\n`);

  // MongoDB 연결
  await connectDB();

  // 웹 대시보드 서버 시작
  const webServer = startWebServer(3001);

  // BullMQ Queue 생성
  const queue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
  });

  // BullMQ Worker 생성
  const worker = new Worker(
    QUEUE_NAME,
    async (_job) => {
      await processJob();
    },
    {
      connection: redisConnection,
      concurrency: 1, // 동시에 하나의 작업만 처리
    },
  );

  // Worker 이벤트 핸들러
  worker.on("completed", (job) => {
    console.log(`📋 Job ${job.id} 완료`);
  });

  worker.on("failed", (job, err) => {
    console.error(`📋 Job ${job?.id} 실패:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("Worker 에러:", err);
  });

  // 기존 반복 작업 제거 후 새로 등록
  await queue.obliterate({ force: true });

  // 10분마다 반복되는 작업 등록
  await queue.add(
    JOB_NAME,
    {},
    {
      repeat: {
        every: 10 * 60 * 1000, // 10분 (밀리초)
      },
      removeOnComplete: { count: 10 }, // 완료된 작업 10개만 유지
      removeOnFail: { count: 50 }, // 실패한 작업 50개만 유지
    },
  );

  // 시작하자마자 첫 번째 작업 즉시 실행
  await queue.add(
    JOB_NAME,
    {},
    {
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    },
  );

  console.log("✅ BullMQ Worker 시작됨");
  console.log("📋 10분 간격 반복 작업 등록됨\n");

  // 종료 시그널 처리
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n\n👋 ${signal} 신호 감지...`);
    await worker.close();
    await queue.close();
    webServer.stop();
    await closeDB();
    process.exit(0);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

main().catch(console.error);

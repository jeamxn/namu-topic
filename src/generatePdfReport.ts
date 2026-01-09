import path from "node:path";
import type { Db } from "mongodb";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

const FONT_PATH = path.join(process.cwd(), "public/fonts/WantedSansVariable.ttf");

interface ReportOptions {
  period: "daily" | "weekly";
  date?: Date;
}

interface TrendingStats {
  keyword: string;
  appearances: number;
  averageRank: number;
  bestRank: number;
  lastSeen: Date;
}

/**
 * PDF 리포트 생성 함수
 */
export const generatePdfReport = async (db: Db, options: ReportOptions): Promise<Buffer> => {
  const { period, date = new Date() } = options;

  // 기간 계산
  const endDate = dayjs(date).endOf("day").toDate();
  const startDate =
    period === "daily"
      ? dayjs(date).startOf("day").toDate()
      : dayjs(date).subtract(6, "day").startOf("day").toDate();

  // 데이터 수집
  const sessions = await db
    .collection("crawl_sessions")
    .find({
      done: true,
      createdAt: { $gte: startDate, $lte: endDate },
    })
    .sort({ createdAt: -1 })
    .toArray();

  if (sessions.length === 0) {
    throw new Error("해당 기간에 데이터가 없습니다.");
  }

  // 키워드별 통계 계산
  const keywordStats = new Map<string, TrendingStats>();

  for (const session of sessions) {
    const trending = await db
      .collection("trending_snapshots")
      .find({ crawlSessionId: session._id })
      .toArray();

    for (const item of trending) {
      const existing = keywordStats.get(item.keyword);
      if (existing) {
        existing.appearances++;
        existing.averageRank = (existing.averageRank * (existing.appearances - 1) + item.rank) / existing.appearances;
        existing.bestRank = Math.min(existing.bestRank, item.rank);
        existing.lastSeen = session.createdAt > existing.lastSeen ? session.createdAt : existing.lastSeen;
      } else {
        keywordStats.set(item.keyword, {
          keyword: item.keyword,
          appearances: 1,
          averageRank: item.rank,
          bestRank: item.rank,
          lastSeen: session.createdAt,
        });
      }
    }
  }

  // 상위 키워드 정렬 (출현 횟수 기준)
  const topKeywords = Array.from(keywordStats.values())
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 20);

  // PDF 생성
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // 한글 폰트 등록
    doc.registerFont("WantedSans", FONT_PATH);
    doc.font("WantedSans");

    // 제목
    doc.fontSize(24).text(`나무위키 실시간 검색어 ${period === "daily" ? "일간" : "주간"} 리포트`, {
      align: "center",
    });

    doc.moveDown(0.5);

    // 기간 정보
    const periodText =
      period === "daily"
        ? dayjs(date).format("YYYY년 MM월 DD일")
        : `${dayjs(startDate).format("YYYY년 MM월 DD일")} ~ ${dayjs(endDate).format("YYYY년 MM월 DD일")}`;

    doc.fontSize(12).fillColor("#666666").text(periodText, { align: "center" });

    doc.moveDown(1);

    // 요약 정보
    doc.fontSize(16).fillColor("#000000").text("📊 요약", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11).text(`• 총 수집 횟수: ${sessions.length}회`);
    doc.text(`• 고유 키워드 수: ${keywordStats.size}개`);
    doc.text(`• 가장 많이 등장한 키워드: ${topKeywords[0]?.keyword || "없음"} (${topKeywords[0]?.appearances || 0}회)`);

    doc.moveDown(1.5);

    // 상위 키워드 목록
    doc.fontSize(16).fillColor("#000000").text("🔥 인기 키워드 TOP 20", { underline: true });
    doc.moveDown(0.5);

    // 테이블 헤더
    const tableTop = doc.y;
    const colWidths = [40, 180, 80, 80, 100];
    const colX = [50, 90, 270, 350, 430];

    doc.fontSize(10).fillColor("#000000");
    doc.text("순위", colX[0], tableTop, { width: colWidths[0], align: "center" });
    doc.text("키워드", colX[1], tableTop, { width: colWidths[1] });
    doc.text("출현 횟수", colX[2], tableTop, { width: colWidths[2], align: "center" });
    doc.text("평균 순위", colX[3], tableTop, { width: colWidths[3], align: "center" });
    doc.text("최고 순위", colX[4], tableTop, { width: colWidths[4], align: "center" });

    doc.moveDown(0.3);

    // 구분선
    doc.strokeColor("#cccccc").moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.moveDown(0.3);

    // 테이블 데이터
    topKeywords.forEach((stat, index) => {
      const rowY = doc.y;

      // 페이지 넘김 체크
      if (rowY > 700) {
        doc.addPage();
        doc.y = 50;
      }

      doc.fontSize(10).fillColor("#000000");
      doc.text(`${index + 1}`, colX[0], rowY, { width: colWidths[0], align: "center" });
      doc.text(stat.keyword, colX[1], rowY, { width: colWidths[1], ellipsis: true });
      doc.text(`${stat.appearances}회`, colX[2], rowY, { width: colWidths[2], align: "center" });
      doc.text(stat.averageRank.toFixed(1), colX[3], rowY, { width: colWidths[3], align: "center" });
      doc.text(`${stat.bestRank}위`, colX[4], rowY, { width: colWidths[4], align: "center" });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // 최근 트렌딩 스냅샷 (최신 3개)
    doc.addPage();
    doc.fontSize(16).fillColor("#000000").text("📸 최근 실시간 검색어 스냅샷", { underline: true });
    doc.moveDown(0.5);

    const recentSessions = sessions.slice(0, 3);

    for (const session of recentSessions) {
      const trending = await db
        .collection("trending_snapshots")
        .find({ crawlSessionId: session._id })
        .sort({ rank: 1 })
        .limit(10)
        .toArray();

      doc.fontSize(12).fillColor("#333333").text(`🕐 ${dayjs(session.createdAt).format("YYYY-MM-DD HH:mm")}`);
      doc.moveDown(0.3);

      doc.fontSize(10).fillColor("#666666");
      trending.forEach((item) => {
        doc.text(`${item.rank}. ${item.keyword}`);
      });

      doc.moveDown(1);

      // 페이지 넘김 체크
      if (doc.y > 650) {
        doc.addPage();
      }
    }

    // 푸터
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#999999")
        .text(`생성일: ${dayjs().format("YYYY-MM-DD HH:mm:ss")} | 페이지 ${i + 1} / ${pages.count}`, 50, 770, {
          align: "center",
        });
    }

    doc.end();
  });
};

export default generatePdfReport;

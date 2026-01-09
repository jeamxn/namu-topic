import type { Readable } from "node:stream";
import dayjs from "dayjs";
import PDFDocument from "pdfkit";

import type { AiAnalysisDocument, TrendingDocument } from "./types";

interface TrendingWithAnalysis extends TrendingDocument {
  aiAnalysis?: AiAnalysisDocument | null;
}

/**
 * 트렌딩 데이터를 PDF 리포트로 생성
 */
export const generatePdfReport = (trendingData: TrendingWithAnalysis[], sessionDate: Date): Readable => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  // 폰트 설정 (한글 지원)
  const fontPath = "/workspace/public/fonts/WantedSansVariable.ttf";
  try {
    doc.registerFont("WantedSans", fontPath);
    doc.font("WantedSans");
  } catch (error) {
    console.warn("한글 폰트 로드 실패, 기본 폰트 사용:", error);
    // 폰트 로드 실패 시 기본 폰트 사용
  }

  // 제목
  doc.fontSize(24).fillColor("#1e40af").text("나무위키 실시간 검색어 리포트", { align: "center" });

  // 날짜
  doc.fontSize(12).fillColor("#64748b").text(dayjs(sessionDate).format("YYYY년 MM월 DD일 HH:mm"), {
    align: "center",
  });

  doc.moveDown(2);

  // 각 트렌딩 키워드별 정보 출력
  for (const trending of trendingData) {
    // 페이지 넘김 체크
    if (doc.y > 700) {
      doc.addPage();
    }

    // 순위 배지
    doc.fontSize(14).fillColor("#ffffff").rect(doc.x, doc.y, 40, 30).fill("#3b82f6");

    const rankY = doc.y - 30;
    doc
      .fontSize(16)
      .fillColor("#ffffff")
      .text(trending.rank.toString(), doc.x + 5, rankY + 7, {
        width: 30,
        align: "center",
      });

    // 키워드
    doc
      .fontSize(18)
      .fillColor("#1e293b")
      .text(trending.keyword, doc.x + 50, rankY, { continued: false });

    doc.moveDown(0.5);

    // AI 분석 결과가 있는 경우
    if (trending.aiAnalysis) {
      const analysis = trending.aiAnalysis;

      // 한줄 요약
      if (analysis.summary) {
        doc
          .fontSize(10)
          .fillColor("#475569")
          .text("요약: ", { continued: true })
          .fillColor("#0f172a")
          .text(analysis.summary);
        doc.moveDown(0.3);
      }

      // 실검 이유
      if (analysis.reason) {
        doc
          .fontSize(10)
          .fillColor("#475569")
          .text("실검 이유: ", { continued: true })
          .fillColor("#0f172a")
          .text(analysis.reason);
        doc.moveDown(0.3);
      }

      // 여론 및 반응
      if (analysis.publicOpinion) {
        doc
          .fontSize(10)
          .fillColor("#475569")
          .text("여론: ", { continued: true })
          .fillColor("#0f172a")
          .text(analysis.publicOpinion);
        doc.moveDown(0.3);
      }

      // 관련 정보
      if (analysis.relatedInfo) {
        const info = analysis.relatedInfo;
        doc.fontSize(10).fillColor("#475569").text("관련 정보:");

        if (info.category) {
          doc.fontSize(9).fillColor("#64748b").text(`  분류: ${info.category}`);
        }
        if (info.relatedPeople) {
          doc.fontSize(9).fillColor("#64748b").text(`  관련 인물: ${info.relatedPeople}`);
        }
        if (info.occurredAt) {
          doc.fontSize(9).fillColor("#64748b").text(`  발생 시점: ${info.occurredAt}`);
        }
        if (info.relatedKeywords) {
          doc.fontSize(9).fillColor("#64748b").text(`  관련 키워드: ${info.relatedKeywords}`);
        }
        doc.moveDown(0.3);
      }

      // 관련 링크
      if (analysis.relatedLinks && analysis.relatedLinks.length > 0) {
        doc.fontSize(10).fillColor("#475569").text("관련 링크:");
        for (const link of analysis.relatedLinks.slice(0, 3)) {
          doc.fontSize(9).fillColor("#2563eb").text(`  • ${link.title}`, {
            link: link.url,
            underline: true,
          });
        }
        doc.moveDown(0.3);
      }
    } else {
      doc.fontSize(10).fillColor("#94a3b8").text("AI 분석 결과가 없습니다.");
    }

    // 구분선
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(50, doc.y + 10)
      .lineTo(545, doc.y + 10)
      .stroke();

    doc.moveDown(1.5);
  }

  // 푸터
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`페이지 ${i + 1} / ${pageCount}`, 50, doc.page.height - 30, {
        align: "center",
      });
  }

  doc.end();

  return doc as unknown as Readable;
};

export default generatePdfReport;

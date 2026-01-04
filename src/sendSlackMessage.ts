import path from "node:path";
import { App } from "@slack/bolt";
import { marked } from "marked";
import PDFDocument from "pdfkit";

const slack = new App({
  token: Bun.env.SLACK_BOT_TOKEN,
  appToken: Bun.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const FONT_PATH = path.join(process.cwd(), "public/fonts/WantedSansVariable.ttf");

const sendSlackMessage = async (userId: string, markdown: string) => {
  console.log("🤖 PDF 생성 중...");
  const pdfBuffer = await generatePdfFromMarkdown(markdown);
  console.log("🤖 PDF 생성 완료...");

  // 사용자와의 DM 채널 열기
  const conversation = await slack.client.conversations.open({
    users: userId,
  });

  if (!conversation.channel?.id) {
    throw new Error("DM 채널을 열 수 없습니다.");
  }

  console.log("🤖 PDF 업로드 중...");
  // Slack에 PDF 파일 업로드
  await slack.client.files.uploadV2({
    channel_id: conversation.channel.id,
    file: pdfBuffer,
    filename: "report.pdf",
    title: "리포트",
  });
  console.log("🤖 PDF 업로드 완료...");
};

const generatePdfFromMarkdown = (markdown: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 20,
    });
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("WantedSans", FONT_PATH);
    doc.font("WantedSans");
    marked.lexer(markdown);
    doc.end();
  });
};

export default sendSlackMessage;

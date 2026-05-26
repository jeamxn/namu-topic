import { getNamuwikiContent, type NamuwikiRelatedLink } from "./getTrendingKeywords";
import { generateText } from "./vertexai";

const SUMMARY_SYSTEM = `당신은 사실 중심으로 문서를 요약하는 뉴스 데스크입니다.
주어진 나무위키 문서를 평가/감상/추측 없이 사실 위주로 한국어 250자 이내로 압축 요약합니다.
서문, 맺음말, 메타 발언("이 문서는...") 없이 본론만 작성합니다.`;

export interface RelatedDocSummary {
  title: string;
  url: string;
  summary: string;
}

const CONCURRENCY = 3;

export const summarizeRelatedDoc = async (
  title: string,
  url: string,
): Promise<RelatedDocSummary | null> => {
  const { content } = await getNamuwikiContent(url);
  if (!content) return null;
  const summary = await generateText({
    system: SUMMARY_SYSTEM,
    user: `다음 나무위키 문서를 한국어로 250자 이내 사실 위주 요약. 평가/감상 금지.\n\n[문서 제목] ${title}\n\n[본문]\n${content.slice(0, 6000)}`,
  });
  return { title, url, summary: summary.trim().slice(0, 300) };
};

export const summarizeRelatedDocs = async (
  links: NamuwikiRelatedLink[],
): Promise<RelatedDocSummary[]> => {
  if (links.length === 0) return [];
  const out: RelatedDocSummary[] = [];
  const cursor = { i: 0 };
  const runners = Array.from({ length: Math.min(CONCURRENCY, links.length) }, async () => {
    while (true) {
      const idx = cursor.i++;
      if (idx >= links.length) return;
      const link = links[idx];
      if (!link) return;
      try {
        const r = await summarizeRelatedDoc(link.title, link.url);
        if (r) out.push(r);
      } catch (err) {
        console.log(`⚠️ 관련 문서 요약 실패 [${link.title}]:`, (err as Error).message);
      }
    }
  });
  await Promise.all(runners);
  return out;
};

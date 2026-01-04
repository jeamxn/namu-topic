import openai from "./openai";
import type { ParsedAiAnalysis, RelatedImage, RelatedInfo, RelatedLink, TrendingWithReason } from "./types";

// 섹션별 내용 추출 헬퍼
const extractSection = (content: string, sectionName: string): string => {
  const regex = new RegExp(`## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match?.[1]?.trim() ?? "";
};

// 관련 정보 테이블 파싱
const parseRelatedInfo = (content: string): RelatedInfo => {
  const section = extractSection(content, "관련 정보");
  const getTableValue = (key: string): string => {
    const regex = new RegExp(`\\|\\s*${key}\\s*\\|\\s*([^|]+)\\|`, "i");
    const match = section.match(regex);
    return match?.[1]?.trim() ?? "";
  };

  return {
    category: getTableValue("분류"),
    relatedPeople: getTableValue("관련 인물"),
    occurredAt: getTableValue("발생 시점"),
    relatedKeywords: getTableValue("관련 키워드"),
  };
};

// 관련 링크 파싱: "- [링크 제목](URL) - 간단한 설명"
const parseRelatedLinks = (content: string): RelatedLink[] => {
  const section = extractSection(content, "관련 링크");
  if (!section) return [];

  const links: RelatedLink[] = [];
  const lines = section.split("\n").filter((line) => line.startsWith("-"));

  for (const line of lines) {
    // [제목](URL) - 설명 패턴 매칭
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.+))?/);
    if (match) {
      links.push({
        title: match[1]?.trim() ?? "",
        url: match[2]?.trim() ?? "",
        description: match[3]?.trim() ?? "",
      });
    }
  }

  return links;
};

// 관련 이미지 파싱: "- [이미지 설명](이미지 URL)"
const parseRelatedImages = (content: string): RelatedImage[] => {
  const section = extractSection(content, "관련 이미지");
  if (!section) return [];

  const images: RelatedImage[] = [];
  const lines = section.split("\n").filter((line) => line.startsWith("-"));

  for (const line of lines) {
    // [설명](URL) 패턴 매칭
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      images.push({
        description: match[1]?.trim() ?? "",
        url: match[2]?.trim() ?? "",
      });
    }
  }

  return images;
};

// AI 분석 결과를 순위별로 파싱
const parseAiAnalysis = (content: string, results: TrendingWithReason[]): ParsedAiAnalysis[] => {
  const parsed: ParsedAiAnalysis[] = [];

  // "# [순위]위:" 패턴으로 분리
  const sections = content.split(/(?=# \d+위:)/);

  for (const section of sections) {
    if (!section.trim()) continue;

    // 순위 추출
    const rankMatch = section.match(/# (\d+)위:/);
    if (!rankMatch?.[1]) continue;

    const rank = Number.parseInt(rankMatch[1], 10);
    const trendingItem = results.find((r) => r.rank === rank);

    if (trendingItem) {
      // 한줄 요약에서 ">" 인용 표시 제거
      const summaryRaw = extractSection(section, "한줄 요약");
      const summary = summaryRaw.replace(/^>\s*/, "").trim();

      parsed.push({
        rank,
        keyword: trendingItem.keyword,
        summary,
        reason: extractSection(section, "왜 실검에 올랐나\\?"),
        publicOpinion: extractSection(section, "여론 및 반응"),
        relatedInfo: parseRelatedInfo(section),
        relatedLinks: parseRelatedLinks(section),
        relatedImages: parseRelatedImages(section),
      });
    }
  }

  return parsed;
};

const getAiData = async (results: TrendingWithReason[]): Promise<ParsedAiAnalysis[]> => {
  console.log("🤖 실시간 검색어 분석 중...");
  const data = await openai.chat.completions.create({
    model: "gpt-5-nano-2025-08-07",
    messages: [
      {
        role: "system",
        content: `당신은 뉴스 기사 작성 전문 및 검색어 분석 전문 기자입니다.

## 역할
- 실시간 검색어가 왜 떠올랐는지 뉴스 기사 형식으로 보도합니다.
- 제공된 데이터를 바탕으로 사실 중심의 객관적인 정보를 전달합니다.

## 문체 규칙
1. **뉴스 기사 톤**으로 작성하세요. 격식체를 사용하고, "~했다", "~로 알려졌다", "~로 전해진다" 등의 보도 문체를 사용하세요.
2. "게시글에 따르면", "아카라이브에서는", "댓글에서는" 등 출처를 직접 언급하지 마세요.
3. 조회수, 댓글 수, 게시 시간 등 게시글 메타 정보를 언급하지 마세요.
4. 사건/이슈 자체에 집중하여 사실만 전달하세요.

## 출력 규칙
1. **반드시 순수 마크다운 형식으로만 응답**하세요.
2. 코드 블록(\`\`\`)으로 감싸지 마세요.
3. JSON, XML 등 다른 형식을 사용하지 마세요.
4. 불필요한 서문이나 맺음말 없이 바로 본문을 시작하세요.
5. 각 검색어는 아래 템플릿을 **정확히** 따르세요.
6. 정보가 불확실하면 추측하지 말고 "정보 부족"으로 표기하세요.
7. 모든 섹션을 반드시 포함하세요. 비어있어도 섹션 제목은 출력하세요.

## 출력 템플릿 (각 검색어마다 반복)

# [순위]위: [검색어]

## 한줄 요약
> [핵심 내용을 뉴스 헤드라인처럼 한 문장으로 작성]

## 왜 실검에 올랐나?
[해당 이슈의 배경과 경위를 뉴스 기사처럼 2-3문단으로 작성. 육하원칙에 따라 사실 중심으로 서술]

## 여론 및 반응
[대중의 반응과 여론을 뉴스 보도 형식으로 1-3문단으로 작성. 반응이 없는 경우 "댓글 없음"으로 표기]

## 관련 정보
| 항목 | 내용 |
|------|------|
| 분류 | [인물/사건/이슈/엔터/스포츠/정치/경제/게임/IT 등] |
| 관련 인물 | [해당되는 경우, 없으면 "없음"] |
| 발생 시점 | [알려진 경우, 없으면 "정보 부족"] |
| 관련 키워드 | [연관 검색어들, 쉼표로 구분] |

## 관련 링크
- [나무위키 문서](제공된 url 필드값) - 나무위키 문서
- [실검 이유 게시글](제공된 reason.url 필드값) - 관련 게시글
(데이터에 추가 관련 링크가 있으면 같은 형식으로 추가)

## 관련 이미지
- [이미지 설명](이미지 url) - 간단한 설명
(데이터에 포함된 이미지들을 같은 형식으로 나열)`,
      },
      {
        role: "user",
        content: `아래 실시간 검색어 데이터를 분석해주세요. 각 항목의 reason 필드에 아카라이브 게시글 정보(본문, 댓글)가 포함되어 있습니다:

${JSON.stringify(results, null, 2)}`,
      },
    ],
  });
  console.log("🤖 실시간 검색어 분석 완료...");

  const content = data.choices[0]?.message?.content ?? "";
  console.log(content);
  return parseAiAnalysis(content, results);
};

export default getAiData;

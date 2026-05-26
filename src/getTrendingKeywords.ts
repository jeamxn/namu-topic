import * as cheerio from "cheerio";

import instance from "./instance";
import type { TrendingKeyword } from "./types";
import log from "./logger";

const getTrendingKeywords = async (): Promise<TrendingKeyword[]> => {
  const response = await instance("https://namu.wiki/w/나무위키:대문");
  const data = response.response;
  const $ = cheerio.load(data);
  const keywords: TrendingKeyword[] = [];
  const seenKeywords = new Set<string>();

  // /Go?q= 형태의 실시간 검색어 링크 추출
  $('a[href^="/Go?q="]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr("href");
    const title = $el.attr("title");

    if (href && title && !seenKeywords.has(title)) {
      seenKeywords.add(title);
      keywords.push({
        rank: keywords.length + 1,
        keyword: title,
        url: `https://namu.wiki${href}`,
      });
    }
  });

  return keywords;
};

export interface NamuwikiRelatedLink {
  title: string;
  url: string;
}

export interface NamuwikiContentResult {
  content: string | null;
  relatedLinks: NamuwikiRelatedLink[];
}

const HATNOTE_KEYWORDS = ["참고하십시오", "참조", "넘겨주기", "다른 뜻", "동음이의어"];
const MAX_RELATED_LINKS = 4;

/**
 * 나무위키 문서 URL에서 본문 텍스트 + hatnote 관련 문서 링크 추출
 * - 본문은 최대 8000자
 * - 관련 문서는 hatnote/blockquote/상단 p에서 추출, 최대 4개
 * - 추출 실패 시 content=null
 */
export const getNamuwikiContent = async (url: string): Promise<NamuwikiContentResult> => {
  try {
    const response = await instance(url);
    const html = response.response;
    const $ = cheerio.load(html);

    // 나무위키 본문은 .wiki-content 또는 article 안에 있음
    let $content = $(".wiki-content").first();
    if (!$content.length) $content = $("article").first();
    if (!$content.length) $content = $("#article").first();

    if (!$content.length) return { content: null, relatedLinks: [] };

    // 관련 문서 링크 추출 (본문 정리 전에 수행)
    const relatedLinks: NamuwikiRelatedLink[] = [];
    const seenTitles = new Set<string>();

    const addLink = (title: string, href: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      if (seenTitles.has(cleanTitle)) return;
      const absoluteUrl = href.startsWith("http") ? href : `https://namu.wiki${href}`;
      if (absoluteUrl === url) return; // 자기 자신 제외
      seenTitles.add(cleanTitle);
      relatedLinks.push({ title: cleanTitle, url: absoluteUrl });
    };

    // hatnote 후보 영역 탐색
    const hatnoteSelector = "blockquote, .wiki-quote, em, i, small";
    $content.find(hatnoteSelector).each((_, el) => {
      if (relatedLinks.length >= MAX_RELATED_LINKS) return;
      const $el = $(el);
      const text = $el.text();
      if (!HATNOTE_KEYWORDS.some((kw) => text.includes(kw))) return;
      $el.find('a[href^="/w/"]').each((_i, a) => {
        if (relatedLinks.length >= MAX_RELATED_LINKS) return;
        const $a = $(a);
        const href = $a.attr("href");
        if (!href) return;
        const title = ($a.attr("title") ?? $a.text() ?? "").trim();
        addLink(title, href);
      });
    });

    // 본문 최상단 p 1-2개에 있는 /w/ 링크도 후보
    $content.find("p").slice(0, 2).each((_, p) => {
      if (relatedLinks.length >= MAX_RELATED_LINKS) return;
      const $p = $(p);
      const text = $p.text();
      if (!HATNOTE_KEYWORDS.some((kw) => text.includes(kw))) return;
      $p.find('a[href^="/w/"]').each((_i, a) => {
        if (relatedLinks.length >= MAX_RELATED_LINKS) return;
        const $a = $(a);
        const href = $a.attr("href");
        if (!href) return;
        const title = ($a.attr("title") ?? $a.text() ?? "").trim();
        addLink(title, href);
      });
    });

    // 불필요한 요소 제거
    $content.find("script, style, .wiki-table-of-contents, .wiki-edit-section, .wiki-link-internal-redirect, nav, .wiki-footnote").remove();

    const text = $content
      .text()
      .replace(/\[\d+\]/g, "") // 각주 번호 제거
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return { content: null, relatedLinks };
    return { content: text.slice(0, 8000), relatedLinks };
  } catch (err) {
    log.error("namuwiki", `본문 추출 실패 (${url})`, (err as Error).message);
    return { content: null, relatedLinks: [] };
  }
};

export default getTrendingKeywords;

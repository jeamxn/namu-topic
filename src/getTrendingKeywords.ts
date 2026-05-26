import * as cheerio from "cheerio";

import instance from "./instance";
import type { TrendingKeyword } from "./types";

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

/**
 * 나무위키 문서 URL에서 본문 텍스트만 추출
 * - 최대 8000자까지만 사용 (토큰 절약)
 * - 추출 실패 시 null
 */
export const getNamuwikiContent = async (url: string): Promise<string | null> => {
  try {
    const response = await instance(url);
    const html = response.response;
    const $ = cheerio.load(html);

    // 나무위키 본문은 .wiki-content 또는 article 안에 있음
    let $content = $(".wiki-content").first();
    if (!$content.length) $content = $("article").first();
    if (!$content.length) $content = $("#article").first();

    if (!$content.length) return null;

    // 불필요한 요소 제거
    $content.find("script, style, .wiki-table-of-contents, .wiki-edit-section, .wiki-link-internal-redirect, nav, .wiki-footnote").remove();

    const text = $content
      .text()
      .replace(/\[\d+\]/g, "") // 각주 번호 제거
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return null;
    return text.slice(0, 8000);
  } catch (err) {
    console.error(`나무위키 본문 추출 실패 (${url}):`, (err as Error).message);
    return null;
  }
};

export default getTrendingKeywords;

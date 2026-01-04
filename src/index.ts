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

const trendingKeywords = await getTrendingKeywords();

console.log("\n📊 나무위키 실시간 검색어 TOP 10\n");
console.log(JSON.stringify(trendingKeywords.slice(0, 10), null, 2));

import * as cheerio from "cheerio";

import instance from "./instance";
import type {
  ArcaComment,
  ArcaPost,
  ArcaPostDetail,
  SearchReasonResult,
} from "./types";

const ARCA_BASE_URL = "https://arca.live";
const NAMUHOTNOW_URL = `${ARCA_BASE_URL}/b/namuhotnow`;

/**
 * 아카라이브 namuhotnow 채널에서 키워드로 게시글 검색
 * @param keyword - 검색할 키워드
 * @returns 검색된 게시글 목록
 */
export const searchPosts = async (keyword: string): Promise<ArcaPost[]> => {
  const encodedKeyword = encodeURIComponent(keyword);
  const searchUrl = `${NAMUHOTNOW_URL}?target=title&keyword=${encodedKeyword}`;

  const response = await instance(searchUrl);
  const html = response.response;
  const $ = cheerio.load(html);

  const posts: ArcaPost[] = [];

  $("a.vrow").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const title = $el.find(".title").text().trim();
    const badge = $el.find(".badge").text().trim();

    // 공지사항 제외 및 실제 게시글만 추출
    if (!href || !title || href.includes("undefined")) return;

    // 게시글 ID 추출
    const idMatch = href.match(/\/b\/namuhotnow\/(\d+)/);
    if (!idMatch) return;

    const id = idMatch[1];

    // 작성자, 날짜, 조회수 추출
    const author = $el.find(".user-info").text().trim() || "익명";
    const dateText = $el.find(".col-time").text().trim();
    const viewText = $el.find(".col-view").text().trim();
    const commentText = $el.find(".comment-count").text().trim();

    const viewCount = Number.parseInt(viewText.replace(/,/g, ""), 10) || 0;
    const commentCount =
      Number.parseInt(commentText.replace(/[\[\]]/g, ""), 10) || 0;

    posts.push({
      id,
      title,
      url: `${ARCA_BASE_URL}${href.split("?")[0]}`, // 쿼리 파라미터 제거
      badge,
      author,
      createdAt: dateText,
      viewCount,
      commentCount,
    });
  });

  // 공지사항 제외 (ID가 너무 낮은 것들)
  return posts.filter((post) => Number.parseInt(post.id, 10) > 100000000);
};

/**
 * 게시글 상세 정보 조회 (본문 + 댓글)
 * @param postId - 게시글 ID
 * @returns 게시글 상세 정보
 */
export const getPostDetail = async (
  postId: string
): Promise<ArcaPostDetail | null> => {
  const postUrl = `${NAMUHOTNOW_URL}/${postId}`;

  try {
    const response = await instance(postUrl);
    const html = response.response;
    const $ = cheerio.load(html);

    // 제목 추출
    const titleElement = $(".article-head .title");
    const fullTitle = titleElement.text().trim();
    const badge = titleElement.find(".badge").text().trim();
    const title = fullTitle.replace(badge, "").trim();

    // 본문 추출 (HTML 형식 유지)
    const articleContent = $(".article-content");
    // 불필요한 요소만 제거
    articleContent.find("script, style").remove();
    const content = articleContent.html()?.trim() || "";

    // 작성자 정보
    const author = $(".article-head .user-info .nickname").text().trim();
    const createdAt = $(".article-head .date-time").text().trim();
    const viewText = $(".article-head .article-info .body")
      .first()
      .text()
      .trim();
    const viewCount = Number.parseInt(viewText.replace(/,/g, ""), 10) || 0;

    // 댓글 추출
    const comments: ArcaComment[] = [];
    $(".comment-wrapper .comment-item").each((_, el) => {
      const $comment = $(el);
      const commentAuthor =
        $comment.find(".user-info .nickname").text().trim() || "익명";
      let commentContent = $comment.find(".message").text().trim();
      const commentDate = $comment.find(".date-time").text().trim();

      // 불필요한 텍스트 제거
      commentContent = commentContent
        .replace(/Unfold\s*▼/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (commentContent) {
        comments.push({
          author: commentAuthor,
          content: commentContent,
          createdAt: commentDate,
        });
      }
    });

    return {
      id: postId,
      title,
      url: postUrl,
      badge,
      author,
      createdAt,
      viewCount,
      commentCount: comments.length,
      content,
      comments,
    };
  } catch (error) {
    console.error(`게시글 ${postId} 조회 실패:`, error);
    return null;
  }
};

/**
 * 실시간 검색어 이유 조회
 * @param keyword - 검색할 키워드
 * @returns 검색 결과 (게시글 목록)
 */
export const getSearchReason = async (
  keyword: string
): Promise<SearchReasonResult> => {
  console.log(`🔍 "${keyword}" 실검 이유 검색 중...`);
  const posts = await searchPosts(keyword);

  return {
    keyword,
    posts,
  };
};

/**
 * 실시간 검색어 이유 상세 조회 (본문 + 댓글 포함)
 * @param keyword - 검색할 키워드
 * @returns 첫 번째 게시글의 상세 정보
 */
export const getSearchReasonDetail = async (
  keyword: string
): Promise<ArcaPostDetail | null> => {
  const result = await getSearchReason(keyword);

  if (result.posts.length === 0) {
    console.log(`❌ "${keyword}"에 대한 게시글을 찾을 수 없습니다.`);
    return null;
  }

  // 첫 번째 게시글의 상세 정보 조회
  const firstPost = result.posts[0];
  console.log(`📄 게시글 상세 조회: ${firstPost.title}`);

  return getPostDetail(firstPost.id);
};

export default getSearchReason;


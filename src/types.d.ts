// FlareSolverr에 보낼 명령 요청 타입
export interface FlareSolverrRequest {
  cmd: string; // 예: 'request.get', 'sessions.create'
  url?: string; // 스크래핑할 대상 URL
  maxTimeout?: number; // 밀리초 단위 (기본 60000)
  session?: string; // 세션 ID (선택사항)
  cookies?: Array<{
    // 쿠키 (선택사항)
    name: string;
    value: string;
    domain: string;
    path?: string;
  }>;
  returnOnlyCookies?: boolean;
}

// FlareSolverr로부터 받을 응답 데이터 타입
export interface FlareSolverrResponse {
  status: string; // 'ok' 또는 'error'
  message: string;
  startTimestamp: number;
  endTimestamp: number;
  version: string;
  solution: {
    url: string;
    status: number;
    headers: Record<string, string>;
    response: string; // 실제 HTML 소스
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      size: number;
      httpOnly: boolean;
      secure: boolean;
      session: boolean;
      sameSite: string;
    }>;
    userAgent: string;
  };
}

export interface TrendingKeyword {
  rank: number;
  keyword: string;
  url: string;
}

// 아카라이브 실검 이유 게시글
export interface ArcaPost {
  id: string; // 게시글 ID
  title: string; // 게시글 제목 (키워드들)
  url: string; // 게시글 URL
  badge: string; // 카테고리 배지 (일반, TV, 정치 등)
  author: string; // 작성자
  createdAt: string; // 작성일
  viewCount: number; // 조회수
  commentCount: number; // 댓글 수
}

// 아카라이브 게시글 상세 정보
export interface ArcaPostDetail extends ArcaPost {
  content: string; // 본문 내용
  comments: ArcaComment[]; // 댓글 목록
}

// 아카라이브 댓글
export interface ArcaComment {
  author: string; // 작성자
  content: string; // 댓글 내용
  createdAt: string; // 작성일
}

// 실검 이유 검색 결과
export interface SearchReasonResult {
  keyword: string; // 검색 키워드
  posts: ArcaPost[]; // 관련 게시글 목록
}

// 실시간 검색어 + 실검 이유 통합 결과
export interface TrendingWithReason {
  rank: number; // 순위
  keyword: string; // 키워드
  url: string; // 나무위키 URL
  reason: ArcaPostDetail | null; // 실검 이유 (아카라이브 게시글)
}

// 크롤링 세션 문서 (사이클마다 고유 문서 생성)
export interface CrawlSessionDocument {
  _id?: import("mongodb").ObjectId; // MongoDB ObjectId
  createdAt: Date; // 세션 시작 시간
  done: boolean; // 작업 완료 여부
}

// MongoDB에 저장할 트렌딩 데이터 문서 (순위별 개별 저장)
export interface TrendingDocument {
  _id?: import("mongodb").ObjectId; // MongoDB ObjectId
  crawlSessionId: import("mongodb").ObjectId; // crawl_sessions._id (FK)
  rank: number; // 순위
  keyword: string; // 키워드
  url: string; // 나무위키 URL
}

// 아카라이브 스냅샷 문서 (reason 데이터 별도 저장)
export interface ArcaliveSnapshotDocument {
  _id?: import("mongodb").ObjectId; // MongoDB ObjectId
  trendingSnapshotId: import("mongodb").ObjectId; // trending_snapshots._id (FK)
  postDetail: ArcaPostDetail; // 아카라이브 게시글 상세
}

// 관련 정보 (테이블 형식)
export interface RelatedInfo {
  category: string; // 분류 (인물/사건/이슈/엔터/스포츠/정치/경제 등)
  relatedPeople: string; // 관련 인물
  occurredAt: string; // 발생 시점
  relatedKeywords: string; // 관련 키워드
}

// 관련 링크
export interface RelatedLink {
  title: string; // 링크 제목
  url: string; // URL
  description: string; // 간단한 설명
}

// 관련 이미지
export interface RelatedImage {
  description: string; // 이미지 설명
  url: string; // 이미지 URL
}

// MongoDB에 저장할 AI 분석 결과 문서 (순위별 개별 저장)
export interface AiAnalysisDocument {
  _id?: import("mongodb").ObjectId; // MongoDB ObjectId
  trendingSnapshotId: import("mongodb").ObjectId; // trending_snapshots._id (FK)
  keyword: string; // 키워드
  summary: string; // 한줄 요약
  reason: string; // 왜 실검에 올랐나?
  publicOpinion: string; // 여론 및 반응
  relatedInfo: RelatedInfo; // 관련 정보
  relatedLinks: RelatedLink[]; // 관련 링크
  relatedImages: RelatedImage[]; // 관련 이미지
}

// 순위별 AI 분석 결과 (파싱된 구조)
export interface ParsedAiAnalysis {
  rank: number;
  keyword: string;
  summary: string;
  reason: string;
  publicOpinion: string;
  relatedInfo: RelatedInfo;
  relatedLinks: RelatedLink[];
  relatedImages: RelatedImage[];
}

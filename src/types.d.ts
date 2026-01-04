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

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

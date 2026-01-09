# namu-topic

나무위키 실시간 검색어를 수집하고 AI로 분석하여 웹 대시보드로 제공하는 프로젝트입니다.

## 주요 기능

### 🔍 실시간 검색어 수집
- 10분 간격으로 나무위키 실시간 검색어 자동 수집
- 아카라이브에서 검색 사유 크롤링
- MongoDB에 데이터 저장 및 이력 관리

### 🤖 AI 분석
- OpenAI를 활용한 실시간 검색어 분석
- 키워드 요약, 실검 이유, 여론 분석 제공
- 관련 정보 및 링크 자동 수집

### 📊 웹 대시보드
- 실시간 순위 확인
- 순위 변동 그래프
- 순위 기록 조회 (페이지네이션)
- 반응형 디자인 (모바일/태블릿/데스크톱)

### 📄 PDF 리포트 생성 (NEW!)
- **일간 리포트**: 하루 동안의 트렌딩 키워드 통계 및 분석
- **주간 리포트**: 일주일 동안의 트렌딩 키워드 통계 및 분석
- 키워드별 출현 횟수, 평균 순위, 최고 순위 제공
- 최근 실시간 검색어 스냅샷 포함
- 웹 대시보드에서 버튼 클릭으로 간편하게 다운로드

## 설치 및 실행

### 의존성 설치

```bash
bun install
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/namu-topic

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Slack (선택사항)
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_APP_TOKEN=your-slack-app-token
```

### 실행

```bash
# 개발 모드 (Hot Reload)
bun run dev

# 프로덕션 모드
bun run start
```

## API 엔드포인트

### 트렌딩 데이터
- `GET /api/trending/latest` - 최신 트렌딩 데이터
- `GET /api/trending/history?hours=24` - 트렌딩 히스토리 (기본 24시간)
- `GET /api/trending/keyword/:keyword?hours=24` - 특정 키워드 순위 변동
- `GET /api/trending/records?page=1&limit=20` - 순위 기록 (페이지네이션)
- `GET /api/trending/keyword-detail?sessionId=xxx&keyword=xxx` - 키워드 상세 정보

### PDF 리포트
- `GET /api/report/pdf?period=daily&date=2024-01-09` - PDF 리포트 생성
  - `period`: `daily` (일간) 또는 `weekly` (주간)
  - `date`: 리포트 기준 날짜 (ISO 8601 형식, 선택사항)

## 기술 스택

- **Runtime**: [Bun](https://bun.sh) - 빠른 JavaScript 런타임
- **Backend**: TypeScript, Bun Server
- **Frontend**: React 19, TypeScript, TailwindCSS
- **Database**: MongoDB
- **Queue**: BullMQ (Redis)
- **AI**: OpenAI GPT
- **PDF**: PDFKit
- **Crawling**: Cheerio, Axios

## 프로젝트 구조

```
namu-topic/
├── src/
│   ├── index.ts                    # 메인 엔트리포인트
│   ├── getAiData.ts               # AI 분석 로직
│   ├── getAllTrendingWithReasons.ts # 실검 + 이유 수집
│   ├── getTrendingKeywords.ts     # 나무위키 실검 크롤링
│   ├── getSearchReason.ts         # 아카라이브 이유 크롤링
│   ├── generatePdfReport.ts       # PDF 리포트 생성 (NEW!)
│   ├── mongodb.ts                 # MongoDB 연결
│   ├── openai.ts                  # OpenAI 클라이언트
│   ├── types.d.ts                 # TypeScript 타입 정의
│   └── web/
│       ├── server.ts              # 웹 서버 (API + SSR)
│       ├── public/
│       │   └── index.html         # HTML 템플릿
│       └── frontend/
│           ├── App.tsx            # 메인 앱 컴포넌트
│           ├── components/
│           │   ├── Header.tsx     # 헤더 (PDF 다운로드 버튼 포함)
│           │   ├── TrendingRankings.tsx
│           │   ├── RankChangeGraph.tsx
│           │   ├── TrendingRecords.tsx
│           │   └── PdfDownloadButton.tsx (NEW!)
│           └── api.ts             # API 클라이언트
├── public/
│   └── fonts/
│       └── WantedSansVariable.ttf # 한글 폰트
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## 데이터베이스 스키마

### crawl_sessions
크롤링 세션 정보 (10분마다 생성)
```typescript
{
  _id: ObjectId,
  createdAt: Date,
  done: boolean
}
```

### trending_snapshots
실시간 검색어 스냅샷 (순위별 개별 저장)
```typescript
{
  _id: ObjectId,
  crawlSessionId: ObjectId,  // FK to crawl_sessions
  rank: number,
  keyword: string,
  url: string
}
```

### ai_analyses
AI 분석 결과 (순위별 개별 저장)
```typescript
{
  _id: ObjectId,
  trendingSnapshotId: ObjectId,  // FK to trending_snapshots
  keyword: string,
  summary: string,
  reason: string,
  publicOpinion: string,
  relatedInfo: {
    category: string,
    relatedPeople: string,
    occurredAt: string,
    relatedKeywords: string
  },
  relatedLinks: Array<{
    title: string,
    url: string,
    description: string
  }>,
  relatedImages: Array<{
    description: string,
    url: string
  }>
}
```

### arcalive_snapshots
아카라이브 검색 이유 (reason 데이터 별도 저장)
```typescript
{
  _id: ObjectId,
  trendingSnapshotId: ObjectId,  // FK to trending_snapshots
  postDetail: {
    id: string,
    title: string,
    url: string,
    badge: string,
    author: string,
    createdAt: string,
    viewCount: number,
    commentCount: number,
    content: string,
    comments: Array<{
      author: string,
      content: string,
      createdAt: string
    }>
  }
}
```

## 라이선스

이 프로젝트는 [Bun](https://bun.sh)을 사용하여 만들어졌습니다.

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

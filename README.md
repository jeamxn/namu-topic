# namu-topic

나무위키 실시간 검색어를 수집하고 AI로 분석하여 웹 대시보드로 제공하는 서비스입니다.

## 주요 기능

- 🔍 **실시간 검색어 크롤링**: 나무위키 실시간 검색어를 10분마다 자동 수집
- 🤖 **AI 분석**: OpenAI를 활용한 키워드 분석 및 요약
- 📊 **웹 대시보드**: 실시간 순위, 순위 변동 그래프, 히스토리 조회
- 🔎 **키워드 검색**: 과거 키워드 검색 및 히스토리 조회
- 📈 **통계 분석**: 인기 키워드, 순위별 통계, 급상승 키워드 분석
- 💾 **MongoDB 저장**: 모든 데이터를 MongoDB에 체계적으로 저장

## 설치

```bash
bun install
```

## 실행

```bash
bun run start
```

개발 모드 (핫 리로드):

```bash
bun run dev
```

## 환경 변수

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/namu-topic

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# FlareSolverr (Cloudflare 우회)
FLARESOLVERR_URL=http://localhost:8191/v1

# Slack (선택사항)
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id
```

## API 엔드포인트

### 기본 API

#### `GET /api/trending/latest`
최신 트렌딩 데이터를 조회합니다.

**응답 예시:**
```json
{
  "trending": [
    {
      "rank": 1,
      "keyword": "키워드",
      "url": "https://namu.wiki/...",
      "aiAnalysis": { ... }
    }
  ],
  "session": {
    "createdAt": "2025-01-09T12:00:00.000Z"
  }
}
```

#### `GET /api/trending/history?hours=24`
최근 N시간의 트렌딩 히스토리를 조회합니다.

**쿼리 파라미터:**
- `hours` (기본값: 24): 조회할 시간 범위

#### `GET /api/trending/keyword/:keyword?hours=24`
특정 키워드의 순위 변동을 조회합니다.

**쿼리 파라미터:**
- `hours` (기본값: 24): 조회할 시간 범위

#### `GET /api/trending/records?page=1&limit=20`
순위 기록을 페이지네이션으로 조회합니다.

**쿼리 파라미터:**
- `page` (기본값: 1): 페이지 번호
- `limit` (기본값: 20): 페이지당 항목 수

#### `GET /api/trending/keyword-detail?sessionId=xxx&keyword=yyy`
특정 세션의 키워드 상세 정보를 조회합니다.

**쿼리 파라미터:**
- `sessionId` (필수): 크롤 세션 ID
- `keyword` (필수): 키워드

### 🆕 검색 및 통계 API

#### `GET /api/search/keyword?q=검색어&limit=50`
키워드를 검색하고 전체 히스토리를 조회합니다.

**쿼리 파라미터:**
- `q` (필수): 검색할 키워드
- `limit` (기본값: 50): 최대 결과 수

**응답 예시:**
```json
[
  {
    "keyword": "검색어",
    "rank": 3,
    "url": "https://namu.wiki/...",
    "timestamp": "2025-01-09T12:00:00.000Z",
    "sessionId": "...",
    "aiAnalysis": { ... }
  }
]
```

#### `GET /api/stats/top-keywords?days=7&limit=20`
가장 자주 등장한 키워드 TOP N을 조회합니다.

**쿼리 파라미터:**
- `days` (기본값: 7): 조회할 일수
- `limit` (기본값: 20): 최대 결과 수

**응답 예시:**
```json
[
  {
    "keyword": "키워드",
    "count": 42,
    "avgRank": 3.5,
    "minRank": 1,
    "maxRank": 8,
    "lastSeen": "2025-01-09T12:00:00.000Z"
  }
]
```

#### `GET /api/stats/rank-statistics?days=7`
각 순위에 가장 오래 머문 키워드를 조회합니다.

**쿼리 파라미터:**
- `days` (기본값: 7): 조회할 일수

**응답 예시:**
```json
[
  {
    "rank": 1,
    "keyword": "키워드",
    "count": 15
  }
]
```

#### `GET /api/stats/trending-up?hours=24&limit=10`
최근 급상승 키워드를 조회합니다.

**쿼리 파라미터:**
- `hours` (기본값: 24): 조회할 시간 범위
- `limit` (기본값: 10): 최대 결과 수

**응답 예시:**
```json
[
  {
    "keyword": "키워드",
    "currentRank": 2,
    "previousRank": 8,
    "change": 6,
    "url": "https://namu.wiki/..."
  },
  {
    "keyword": "새 키워드",
    "currentRank": 5,
    "previousRank": null,
    "change": "new",
    "url": "https://namu.wiki/..."
  }
]
```

## 기술 스택

- **Runtime**: [Bun](https://bun.sh) - 빠른 JavaScript 런타임
- **Database**: MongoDB - 데이터 저장
- **Queue**: BullMQ + Redis - 작업 스케줄링
- **AI**: OpenAI GPT - 키워드 분석
- **Web Scraping**: Cheerio + FlareSolverr - 웹 크롤링
- **Frontend**: React + Tailwind CSS - 웹 대시보드
- **Charts**: Recharts - 데이터 시각화

## 프로젝트 구조

```
namu-topic/
├── src/
│   ├── index.ts                  # 메인 엔트리 포인트
│   ├── getTrendingKeywords.ts    # 실시간 검색어 크롤링
│   ├── getSearchReason.ts        # 실검 이유 크롤링
│   ├── getAllTrendingWithReasons.ts  # 통합 크롤링
│   ├── getAiData.ts              # AI 분석
│   ├── mongodb.ts                # MongoDB 연결
│   ├── openai.ts                 # OpenAI 클라이언트
│   ├── instance.ts               # FlareSolverr 클라이언트
│   ├── save*.ts                  # 데이터 저장 함수들
│   ├── sendSlackMessage.ts       # Slack 알림
│   ├── types.d.ts                # TypeScript 타입 정의
│   └── web/
│       ├── server.ts             # 웹 서버
│       ├── api/
│       │   └── search.ts         # 🆕 검색 및 통계 API
│       ├── frontend/
│       │   ├── App.tsx           # React 메인 컴포넌트
│       │   ├── api.ts            # API 클라이언트
│       │   ├── types.ts          # 프론트엔드 타입
│       │   └── components/       # React 컴포넌트들
│       └── public/
│           └── index.html        # HTML 템플릿
├── docker/                       # Docker 설정
├── package.json
├── tsconfig.json
└── biome.json                    # 코드 포맷터 설정
```

## Docker 실행

```bash
cd docker
docker-compose up -d
```

## 라이선스

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

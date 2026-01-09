# namu-topic

나무위키 실시간 검색어를 수집하고 AI로 분석하여 웹 대시보드로 제공하는 시스템입니다.

## 주요 기능

- 🔍 나무위키 실시간 검색어 자동 수집 (10분 간격)
- 🤖 OpenAI를 활용한 실시간 검색어 AI 분석
- 📊 실시간 트렌드 웹 대시보드
- 📈 키워드 순위 변동 그래프
- 📝 순위 기록 히스토리
- **📄 PDF 리포트 내보내기 (NEW!)**
- **💾 JSON 데이터 내보내기 (NEW!)**

## 설치 방법

의존성 설치:

```bash
bun install
```

## 실행 방법

메인 애플리케이션 실행:

```bash
bun run start
```

개발 모드 (핫 리로드):

```bash
bun run dev
```

## 새로운 기능: 데이터 내보내기

### PDF 리포트

최신 실시간 검색어 데이터를 PDF 리포트로 다운로드할 수 있습니다.

- 웹 대시보드 헤더의 "PDF" 버튼 클릭
- 또는 API 엔드포인트 직접 호출: `GET /api/export/pdf`

**PDF 리포트 포함 내용:**
- 실시간 검색어 순위
- 키워드별 한줄 요약
- 실검 이유 분석
- 여론 및 반응
- 관련 정보 (분류, 관련 인물, 발생 시점, 관련 키워드)
- 관련 링크

### JSON 데이터

전체 데이터를 JSON 형식으로 다운로드할 수 있습니다.

- 웹 대시보드 헤더의 "JSON" 버튼 클릭
- 또는 API 엔드포인트 직접 호출: `GET /api/export/json`

## API 엔드포인트

### 기존 엔드포인트
- `GET /api/trending/latest` - 최신 트렌딩 데이터
- `GET /api/trending/history?hours=24` - 트렌딩 히스토리
- `GET /api/trending/keyword/:keyword?hours=24` - 키워드 순위 변동
- `GET /api/trending/records?page=1&limit=20` - 순위 기록
- `GET /api/trending/keyword-detail?sessionId=xxx&keyword=xxx` - 키워드 상세

### 새로운 엔드포인트
- `GET /api/export/pdf` - PDF 리포트 다운로드
- `GET /api/export/json` - JSON 데이터 다운로드

## 기술 스택

- **런타임**: Bun v1.3.3+
- **언어**: TypeScript
- **웹 프레임워크**: Bun serve
- **프론트엔드**: React, TailwindCSS, Recharts
- **데이터베이스**: MongoDB
- **작업 큐**: BullMQ (Redis)
- **AI**: OpenAI API
- **크롤링**: Cheerio, Axios
- **PDF 생성**: PDFKit

## 프로젝트 구조

```
namu-topic/
├── src/
│   ├── index.ts                    # 메인 애플리케이션
│   ├── getTrendingKeywords.ts      # 실시간 검색어 수집
│   ├── getSearchReason.ts          # 검색 이유 수집
│   ├── getAiData.ts                # AI 분석
│   ├── generatePdfReport.ts        # PDF 리포트 생성 (NEW!)
│   ├── mongodb.ts                  # MongoDB 연결
│   ├── openai.ts                   # OpenAI 설정
│   └── web/
│       ├── server.ts               # 웹 서버 (업데이트됨)
│       └── frontend/               # React 프론트엔드
│           ├── App.tsx
│           ├── api.ts              # API 클라이언트 (업데이트됨)
│           └── components/
│               ├── Header.tsx      # 헤더 (다운로드 버튼 추가)
│               ├── TrendingRankings.tsx
│               ├── RankChangeGraph.tsx
│               └── TrendingRecords.tsx
├── package.json
├── tsconfig.json
└── README.md
```

## 환경 변수

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=namu-topic

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=your-api-key

# FlareSolverr (Cloudflare 우회)
FLARESOLVERR_URL=http://flaresolverr:8191

# Slack (선택사항)
SLACK_BOT_TOKEN=your-bot-token
SLACK_CHANNEL_ID=your-channel-id
```

## Docker 실행

```bash
cd docker
docker-compose up -d
```

## 라이선스

이 프로젝트는 [Bun](https://bun.com)을 사용하여 생성되었습니다.

# ===== Build Stage =====
FROM oven/bun:1.3.3-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 (캐시 활용)
COPY package.json bun.lock ./

# 의존성 설치
RUN bun install --frozen-lockfile

# 소스 복사
COPY . .

# 포트 노출
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# 앱 실행
CMD ["bun", "run", "start"]

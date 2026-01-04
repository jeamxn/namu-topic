# ===== Build Stage =====
FROM oven/bun:1.3.3-alpine AS builder

WORKDIR /app

# 의존성 파일 복사 (캐시 활용)
COPY package.json bun.lock ./

# 의존성 설치
RUN bun install --frozen-lockfile --production

# 소스 복사
COPY . .

# ===== Production Stage =====
FROM oven/bun:1.3.3-alpine AS production

WORKDIR /app

# 보안을 위한 non-root 유저 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001 -G nodejs

# 빌드 결과물 복사
COPY --from=builder --chown=bun:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bun:nodejs /app/package.json ./
COPY --from=builder --chown=bun:nodejs /app/src ./src
COPY --from=builder --chown=bun:nodejs /app/public ./public
COPY --from=builder --chown=bun:nodejs /app/tsconfig.json ./

# non-root 유저로 전환
USER bun

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 앱 실행
CMD ["bun", "run", "start"]


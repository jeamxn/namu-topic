FROM oven/bun:1.3.3

WORKDIR /app

COPY . .

RUN apt-get update -y
RUN apt-get install -y openssl default-mysql-client git curl git
RUN apt-get clean

RUN bun install --frozen-lockfile

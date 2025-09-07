
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile 

COPY . .

RUN pnpm add -D tsc-alias

RUN pnpm prisma generate
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start:prod"]
FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --filter @thedigihubs/web... --no-frozen-lockfile
COPY . .
WORKDIR /workspace/apps/web
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM node:22-alpine
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json
RUN pnpm install --filter @thedigihubs/api... --filter @thedigihubs/database... --no-frozen-lockfile
COPY . .
RUN pnpm --filter @thedigihubs/database prisma:generate
WORKDIR /workspace/apps/api
EXPOSE 4000
CMD ["pnpm", "start:dev"]

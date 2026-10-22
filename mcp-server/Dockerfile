# Zaoly MCP Server – Node 20, Streamable HTTP
# Coolify: Dockerfile path = mcp-server/Dockerfile, Build context = mcp-server
# Env: ZAOLY_API_URL, ZAOLY_SERVICE_SECRET
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV MCP_STATELESS=1
ENV MCP_PORT=3102
EXPOSE 3102

CMD ["node", "dist/index.js"]

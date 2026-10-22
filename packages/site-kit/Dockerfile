# Site Kit Storybook — Coolify sibling in Zaoly-Creation-v3
# Build context: creation-v3 repository root
# Coolify: Dockerfile path `packages/site-kit/Dockerfile` · port 6007
# Knowledge: knowledge/site-kit-storybook-coolify.md

ARG NODE_IMAGE=node:22-bookworm-slim
ARG NGINX_IMAGE=nginx:1.27-alpine
# CREATION web origin for live override fetch (no hardcoded paths in app code beyond this build arg).
ARG STORYBOOK_ZAOLY_ORIGIN=https://creation-v3.projects-a.plygrnd.tech

FROM ${NODE_IMAGE} AS builder
WORKDIR /workspace/packages/site-kit
COPY packages/site-kit/package.json ./
ENV NODE_ENV=development
ARG STORYBOOK_ZAOLY_ORIGIN
ENV STORYBOOK_ZAOLY_ORIGIN=${STORYBOOK_ZAOLY_ORIGIN}
RUN npm install --no-audit --no-fund
COPY packages/site-kit ./
RUN npm run hydrate:variants \
    && npm run hydrate:compositions \
    && npm run build-storybook \
    && NODE_ENV=production npm run build:cdn \
    && test -f storybook-static/index.html \
    && test -f cdn-dist/site-kit.js \
    && ! grep -q 'jsx-dev-runtime' cdn-dist/site-kit.js

FROM ${NGINX_IMAGE} AS runner
RUN apk add --no-cache wget
COPY packages/site-kit/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/packages/site-kit/storybook-static /usr/share/nginx/html
COPY --from=builder /workspace/packages/site-kit/cdn-dist /usr/share/nginx/html/cdn
ENV PORT=6007
EXPOSE 6007
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:6007/healthz || exit 1

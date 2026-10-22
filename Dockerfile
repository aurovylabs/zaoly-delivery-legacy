# Zaoly – Docker image for Coolify.
# Context: repository root. Design system lives in-repo (`packages/ui`, `packages/ui-tokens`).
# Spec: specs/domain/zaoly-ui-in-repo.md · knowledge/staging-coolify.md

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Builder ----
FROM base AS builder
ENV NODE_ENV=development
COPY . /workspace/zaoly
WORKDIR /workspace/zaoly

# In-repo DS smoke (no external design-system checkout).
RUN test -d packages/ui/src \
    && test -f packages/ui/src/components/HubIndexCard.tsx \
    && test -f packages/ui/src/components/HubIndexLayoutSwitch.tsx \
    && test -f packages/ui/src/components/Stack.tsx \
    && test -f packages/ui/src/components/CanvasViewport.tsx \
    && test -f packages/ui/src/components/LayersPanel.tsx \
    && test -f packages/ui/src/components/BreakpointSwitcher.tsx \
    && test -f packages/ui/src/components/InspectTabs.tsx \
    && test -f packages/ui/src/components/ChatOverlay.tsx \
    && test -f packages/ui/src/components/AppFrame.tsx \
    && test -f packages/ui/src/mag/index.ts \
    && test -f packages/ui/src/mag/fonts/NotoSans-Regular.ttf \
    && grep -q onReorderDrop packages/ui/src/components/LayersPanel.tsx \
    && grep -q onToggleHidden packages/ui/src/components/LayersPanel.tsx \
    && grep -q selectedIds packages/ui/src/components/LayersPanel.tsx \
    && grep -q COMPONENT_PALETTE_DND_MIME packages/ui/src/components/ComponentPalette.tsx \
    && grep -q 'ds-token-picker--compact' packages/ui/src/css/components.css \
    && grep -q "variant === 'compact'" packages/ui/src/components/TokenPicker.tsx \
    && grep -q 'ds-toggle-group--icon' packages/ui/src/css/chip.css \
    && grep -q IconUndo packages/ui/src/components/icons.tsx \
    && grep -q IconItalic packages/ui/src/components/icons.tsx \
    && grep -q IconBan packages/ui/src/components/icons.tsx \
    && grep -q IconStorybook packages/ui/src/components/icons.tsx \
    && grep -q emptyLabel packages/ui/src/components/TokenPicker.tsx \
    && grep -q fontPreview packages/ui/src/components/TokenPicker.tsx \
    && grep -q sampleStyle packages/ui/src/components/TokenPicker.tsx \
    && test -f packages/ui/src/components/SplitCraftMenu.tsx \
    && test -f packages/ui/src/components/Chart.tsx \
    && test -f packages/ui/src/components/Gauge.tsx \
    && grep -q IconGap packages/ui/src/components/icons.tsx \
    && grep -q -- '--surface-1: var(--bg1)' packages/ui/src/css/tokens.css \
    && grep -q -- '--success: var(--ok)' packages/ui/src/css/tokens.css \
    && grep -q -- '--warning: var(--warn)' packages/ui/src/css/tokens.css \
    && grep -q -- '--bad: var(--danger)' packages/ui/src/css/tokens.css \
    && test -f packages/ui-tokens/package.json \
    && test -f packages/ui/package.json

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --include=dev

RUN npm run build -w @zaoly/ui-tokens \
    && npm run build -w @zaoly/ui \
    && test -f packages/ui-tokens/dist/index.js

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
# Coolify runtime secrets must not leak into image layers; blank env vars only for this RUN.
# Next.js collects route modules at build time — auth.ts needs min-32-char placeholders here.
RUN ZAOLY_SERVICE_SECRET=zaoly-docker-build-service-secret-min32 \
    ZAOLY_FEDERATION_AUTH_URL= \
    AUTH_SECRET=zaoly-docker-build-auth-secret-min-32-chars \
    ZAOLY_DATABASE_URL= \
    npm run build

# ---- Runner ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /workspace/zaoly

# GHCR / delivery: links package to this repo (paths.creationGithubRepo).
LABEL org.opencontainers.image.source="https://github.com/aurovylabs/zaoly-delivery"
LABEL org.opencontainers.image.title="zaoly"
LABEL org.opencontainers.image.description="Zaoly enterprise web design editor"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3009
ENV HOSTNAME=0.0.0.0
ENV ZAOLY_FEDERATION_MODE=dummy
ENV ZAOLY_UI_SOURCE=in-repo
# Scene preview (Welle 2) — Playwright Chromium cache. Landing deploy sets INSTALL_PLAYWRIGHT=0.
ARG INSTALL_PLAYWRIGHT=1
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
EXPOSE 3009

# Chromium OS deps for zaoly.scene_preview (Playwright). Default stays on for Coolify.
RUN if [ "$INSTALL_PLAYWRIGHT" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libx11-6 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        wget \
        xdg-utils \
      && rm -rf /var/lib/apt/lists/*; \
    else \
      apt-get update && apt-get install -y --no-install-recommends ca-certificates wget \
      && rm -rf /var/lib/apt/lists/*; \
    fi

COPY --from=builder /workspace/zaoly/package.json ./package.json
COPY --from=builder /workspace/zaoly/package-lock.json ./package-lock.json
COPY --from=builder /workspace/zaoly/node_modules ./node_modules
COPY --from=builder /workspace/zaoly/packages ./packages
COPY --from=builder /workspace/zaoly/apps/web/package.json ./apps/web/package.json
COPY --from=builder /workspace/zaoly/apps/web/.next ./apps/web/.next
COPY --from=builder /workspace/zaoly/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=builder /workspace/zaoly/apps/web/tsconfig.json ./apps/web/tsconfig.json
# next start re-transpiles next.config.ts → needs `./lib/paths` (and public assets).
COPY --from=builder /workspace/zaoly/apps/web/lib/paths.ts ./apps/web/lib/paths.ts
COPY --from=builder /workspace/zaoly/apps/web/public ./apps/web/public
COPY --from=builder /workspace/zaoly/scripts ./scripts

RUN chmod +x ./scripts/docker-entrypoint.sh \
    && if [ "$INSTALL_PLAYWRIGHT" = "1" ]; then \
         mkdir -p /opt/playwright \
         && cd /workspace/zaoly/apps/web \
         && npx playwright install chromium; \
    fi

WORKDIR /workspace/zaoly
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

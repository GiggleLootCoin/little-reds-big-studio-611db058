# Buddy-First Production Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Little Red's Big Studio a polished Android-first workspace where Buddy automatically chooses the best available local/free route and technical engine details stay hidden.

**Architecture:** Preserve TanStack Start + Cloudflare and the local-first browser architecture. Buddy ranks local capabilities first, then free/open browser runners, with graceful fallback. No paid AI API is required.

**Tech Stack:** React, TanStack Start/Router, TypeScript, Tailwind/CSS, IndexedDB, Web Workers, WebAssembly, WebGPU, Cloudflare Workers.

## Global Constraints

- $0-first; no required paid hosting or AI API.
- Android-first/mobile Chrome.
- Buddy is the normal AI-facing abstraction; model/provider/runner names stay hidden.
- Heavy external models may open in a browser tab when needed.
- Local processing is preferred.
- Never claim an external public GPU is unlimited or guaranteed.
- Preserve existing storage/audio workflows.
- Validate type-check, formatting, lint, and production build.

## File Map

- `src/lib/buddy-orchestrator.ts`: automatic route ranking/fallback.
- `src/lib/free-runners.ts`: free/open route registry.
- `src/components/studio/BuddyWelcome.tsx`: premium Buddy-first home.
- `src/routes/index.tsx`: mobile-first shell and normal navigation.
- `src/components/studio/FreeRunnerPanel.tsx`: advanced diagnostics only.
- `src/components/studio/LocalEnginePanel.tsx`: accurate advanced diagnostics.
- Existing visual system and `assets/visual-references`: approved visual identity.

### Task 1 — Orchestration

- [ ] Define user-safe states: ready, preparing, fallback, unavailable.
- [ ] Rank local before external free/open routes.
- [ ] Rank by availability, compatibility, quality, speed and free status.
- [ ] Add deterministic fallback behavior and tests.

### Task 2 — Free routes

- [ ] Keep only real documented public routes.
- [ ] Add capability/input/output/fallback metadata.
- [ ] Keep route names out of normal UI.

### Task 3 — Premium Buddy home

- [ ] Use approved repository imagery.
- [ ] Build cinematic glass/obsidian/crimson mobile-first presentation.
- [ ] Keep task actions, not model actions.
- [ ] Hide technical engine status from Home.
- [ ] Preserve reduced-motion/responsive behavior.

### Task 4 — Advanced diagnostics

- [ ] Put runner/model diagnostics behind Advanced/Developer access.
- [ ] Replace provider-key language in normal workflows with Buddy-safe status.
- [ ] Keep diagnostics available for maintenance.

### Task 5 — Release verification

- [ ] Install dependencies.
- [ ] Type-check.
- [ ] Format check.
- [ ] Lint.
- [ ] Production build.
- [ ] Verify Cloudflare deployment.
- [ ] Verify Android entry/navigation when live browser access is available.

### Task 6 — Final review

- [ ] No required paid API key.
- [ ] Buddy is the normal AI abstraction.
- [ ] External failures have fallback messaging.
- [ ] Uploaded references are used appropriately.
- [ ] Live deployment points to current `main`.

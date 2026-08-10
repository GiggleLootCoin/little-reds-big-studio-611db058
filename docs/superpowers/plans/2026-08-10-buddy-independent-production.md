# Buddy Independent Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Buddy and the six creator actions independently usable from Android with free/open/public-first automatic routing and honest fallback behavior.

**Architecture:** Keep the existing React/Vite Studio, replace hard-coded single-route assumptions with a live Gradio capability router, strengthen Buddy's local-first brain, and preserve browser-native persistence/audio. Heavy generation remains on public open Spaces because full music/video inference is not reliably practical on a phone browser.

**Tech Stack:** React 19, TypeScript, Vite 8, Hugging Face Transformers.js, @gradio/client, browser WebGPU/WebAssembly, Web Speech APIs, Hugging Face public Gradio Spaces, GitHub Pages.

## Global Constraints

- ChatGPT/GPT is optional and must never be a runtime dependency.
- Core operation must not require a paid API key.
- Prefer open-source/publicly accessible engines.
- Route selection must be capability- and health-based.
- No completion message without a real artifact.
- Android/Chrome is the primary client.
- User files are sent only when the user explicitly submits them.

---

### Task 1: Make Gradio routing live and fault tolerant

**Files:**

- Modify: `src/lib/gradio-free.ts`
- Modify: `src/lib/free-runners.ts`

**Interfaces:**

- Produces `runGradio`, `runGradioAll`, `probeFreeRoute`, and `FREE_SPACE_IDS` compatibility for existing callers.
- Existing `FreeCreatePanel` calls continue to compile without changing their public shape.

- [ ] **Step 1: Update the Gradio CDN to the current public client and extend the client type with `view_api()`**
- [ ] **Step 2: Add ordered route candidates for music, image, video, voice clone, and voice swap.**
- [ ] **Step 3: Probe each candidate by connecting and inspecting `view_api()` before submission.**
- [ ] **Step 4: Prefer the highest-priority healthy candidate and fall through on connection, endpoint, queue, or result failure.**
- [ ] **Step 5: Cache successful/failed probes briefly so Android does not repeatedly wake every Space.**
- [ ] **Step 6: Preserve `runGradio`/`runGradioAll` return normalization and real-artifact checks.**
- [ ] **Step 7: Commit the routing layer.**

---

### Task 2: Strengthen Buddy's independent local brain

**Files:**

- Modify: `src/components/studio/BuddyLiveChatLite.tsx`
- Modify: `src/lib/buddy-orchestrator.ts`

**Interfaces:**

- Buddy chat remains usable without any remote service.
- `buddyPlan()` returns a local-first plan when the browser can support it and free-open fallbacks otherwise.

- [ ] **Step 1: Replace the single hard-coded local model URL with a small ordered browser model list.**
- [ ] **Step 2: Select WebGPU only when available and fall back to WASM-compatible execution.**
- [ ] **Step 3: Cache the successful local model selection in memory for the session.**
- [ ] **Step 4: Keep deterministic conversational fallback responses when model loading fails.**
- [ ] **Step 5: Remove the hard-coded `localCapability()` false return and mark browser-native writing as locally available.**
- [ ] **Step 6: Make task planning health-aware rather than assuming the first configured runner is usable.**
- [ ] **Step 7: Commit Buddy independence changes.**

---

### Task 3: Make the six creator actions use the router

**Files:**

- Modify: `src/components/studio/FreeCreatePanel.tsx`

**Interfaces:**

- Existing buttons remain: lyrics, song, artwork, video, clone voice, swap voice.
- Each action reports actual returned media or an honest failure.

- [ ] **Step 1: Route song generation through the live music candidate set.**
- [ ] **Step 2: Route image generation through the live image candidate set.**
- [ ] **Step 3: Route video generation through the live video candidate set.**
- [ ] **Step 4: Route voice cloning through the live TTS/clone candidate set.**
- [ ] **Step 5: Route voice conversion through the live Seed-VC/RVC candidate set.**
- [ ] **Step 6: Add clear progress messages for connecting, queueing, generating, and receiving an artifact.**
- [ ] **Step 7: Preserve local storage for the brief and lyrics.**
- [ ] **Step 8: Commit creator routing changes.**

---

### Task 4: Remove validation workflow self-blocking

**Files:**

- Modify: `.github/workflows/free-validation.yml`

- [ ] **Step 1: Remove unnecessary write permission from pull-request validation.**
- [ ] **Step 2: Stop the validation workflow from committing formatter changes back into PR branches.**
- [ ] **Step 3: Keep formatting as a read-only check.**
- [ ] **Step 4: Commit workflow hardening.**

---

### Task 5: Production verification

**Files:**

- Modify only if verification identifies a concrete failure.

- [ ] **Step 1: Run TypeScript validation.**
- [ ] **Step 2: Run Prettier check.**
- [ ] **Step 3: Run ESLint.**
- [ ] **Step 4: Run production build.**
- [ ] **Step 5: Verify the PR branch Actions workflow executes jobs instead of `action_required`.**
- [ ] **Step 6: Verify the Pages workflow produces a successful deployment.**
- [ ] **Step 7: Exercise lyrics, song, image, video, voice clone, and voice swap through the actual UI paths.**
- [ ] **Step 8: Verify failure of one public Space automatically reaches the next candidate.**
- [ ] **Step 9: Open a production PR containing the complete verified changes.**

## Verification Notes

A public free AI Space can sleep, queue, rebuild, disappear, or change its API. Production readiness therefore means Buddy automatically detects and routes around those conditions; it does not mean an external public service can be guaranteed to have infinite capacity. GPT can be used opportunistically when the surrounding ChatGPT environment provides it, but the Studio must continue independently when it does not.

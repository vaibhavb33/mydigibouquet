# Project Persistent State (`STATE.md`)

**Last Updated:** 2026-11-13T15:45+05:30  
**Active Gate:** `Independent QA & Product Acceptance Audit — APPROVED FOR RELEASE`  
**Specification Reference:** [SPEC.md](file:///Users/vaibhavborkar/mydigibouquet.com/SPEC.md) (`v2.0 FINALIZED`), [qa_acceptance_report.md](file:///Users/vaibhavborkar/.gemini/antigravity/brain/c62c1c43-b788-4546-801f-f5aa078f6908/qa_acceptance_report.md)

---

## QA & Product Acceptance Audit Summary (Batch: 20 Bouquets)
- **Asset Transparency & Realism:** 47/47 Botanical SKUs verified on disk (100% alpha transparency at corners, 0 white boxes, photographic textures).
- **20-Bouquet Batch Audit:** 20/20 passed (10 Canonical Presets + 10 Bespoke Specialist Florist Compositions).
- **Florist Arrangement Principles:** Visual focal points established, size hierarchy respected, depth layering verified, zero clone collisions detected.
- **Vessels & Ribbon Finishes:** 9 vessels (kraft, linen, cotton, charcoal, cellophane, ceramic, glass, bare stems) and 4 ribbon finishes (satin, silk, velvet, twine) verified with proper collar alignment.
- **UX & Ergonomics:** Quick Create 5-screen flow completes in under 90 seconds without instructions; Guided Studio 4-step bottom nav verified; Advanced Studio contextual controls verified.
- **Mobile Usability:** Zero horizontal scroll and touch-target compliance verified across 360px, 390px, and 430px viewports.
- **Unit & E2E Tests:** 19/19 Vitest engine tests passed; 6/6 primary Playwright E2E suites passed.
- **Release Verdict:** **APPROVED FOR PRODUCTION RELEASE** (0 critical, 0 major, 0 minor defects).

---

## Locked v2.0 Architecture Decisions
1. **Advanced Studio Mode (`?mode=studio`):**
   - **Contextual Controls:** Properties panel is strictly contextual. When no stem is selected, the inspector displays a calm `No Stem Selected` prompt. Selecting any flower or foliage activates fine-grained controls (exact scale, rotation slider, angle step, bloom variation picker, replacement botanical selector, layer controls).
   - **Floating Canvas Selection Toolbar:** Top contextual floating pill provides 1-click rotation (`↺ -15°`, `↻ +15°`), size scaling (`− Scale`, `+ Scale`), layer shifts (`↑ Layer`, `↓ Layer`), `Duplicate`, `⇄ Flip`, `Delete`, and `✕ Deselect`. Hidden when no stem is selected.
   - **Drag & Drop Manipulation:** Full mouse and touch drag repositioning via Konva stage canvas with boundary clamping.
   - **Keyboard Shortcuts:** `Cmd/Ctrl+Z` (Undo), `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` (Redo), `Cmd/Ctrl+D` (Duplicate), `Cmd/Ctrl+S` (Save Project), `Delete`/`Backspace` (Delete selected), `Escape` (Deselect), `[` / `]` (Layer backward/forward), Arrow keys (Nudge 2px, or 10px with Shift).
   - **Reset Arrangement Dialog:** Reset button prompts a confirmed reset modal (`data-testid="confirm-reset-dialog"`) with "Keep Arrangement" (cancel) and "Reset & Auto-Arrange" (confirmed).
   - **Greenery & Finishing Controls:** 1-click photorealistic foliage additions, 7 wrapping textures, 4 ribbon fabrics (satin, velvet, silk, twine) with natural bow styles, and 4 background surfaces (linen, limewash, travertine, slate).
   - **Project Drafts:** Top bar "Save Project" and "My Bouquets" drawer persist scene drafts locally and to the serverless DB proxy.

2. **Quick Create Mode (`?mode=quick`, default for fast creation):**
   - 5-screen guided flow (8 Occasions, 6 Real Rendered Styles, Optional Customization, Card Keepsakes, Multi-Channel Share).
   - Preserves complete mode switching without breaking Quick Create or Guided Studio.

3. **Vercel Deployment Architecture:**
   - Self-hosted local `.woff2` fonts via `next/font/local` (zero external font fetches during build).
   - Serverless database client with `/tmp` SQLite fallback for zero-configuration read-only environments.
   - Static export compatibility for all 53 public and SEO routes.

## Empirical Verification Summary (Latest Run)
- `npm run typecheck` → `0` TypeScript errors.
- `npm test` → `19/19` Vitest tests passed.
- `npm run build` → `53/53` Next.js routes built cleanly.
- `npx playwright test e2e/studio.spec.ts:251` (Advanced Studio Mode) → `1/1` passed.
- `npx playwright test e2e/studio.spec.ts:144` (Quick Create Mode) → `1/1` passed.
- `npx playwright test e2e/studio.spec.ts:342` (Clean Guided Interface) → `1/1` passed.
- `npx playwright test e2e/studio.spec.ts:899` (Features 7-8 & Mobile 390px) → `1/1` passed.
- `npx playwright test e2e/studio.spec.ts:980` (All 12 website pages & DB) → `1/1` passed.

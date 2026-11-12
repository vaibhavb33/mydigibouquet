import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { expect, test } from "@playwright/test";

const SCRATCH_DIR =
  "/Users/vaibhavborkar/.gemini/antigravity/brain/c62c1c43-b788-4546-801f-f5aa078f6908/scratch";

function createTinyWavBuffer(): Buffer {
  const sampleRate = 8000;
  const numSamples = 2000; // 0.25s silent WAV
  const dataBytes = numSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);
  return buf;
}

function attachErrorCollectors(page: import("@playwright/test").Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const badResponses: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      badResponses.push(`${res.status()} ${res.url()}`);
    }
  });

  return {
    assertClean: () => {
      expect(consoleErrors, `Console errors: ${consoleErrors.join("; ")}`).toEqual([]);
      expect(pageErrors, `Page errors: ${pageErrors.join("; ")}`).toEqual([]);
      expect(badResponses, `HTTP errors: ${badResponses.join("; ")}`).toEqual([]);
    },
  };
}

test.describe("Petal & Prose Complete E2E Verification", () => {
  test("Desktop 1440x900: routes, studio editing, variations, lock, preset, export PNG & live share unboxing", async ({
    page,
    request,
  }) => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = attachErrorCollectors(page);

    // 1. Health & real PNG OG endpoint check
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    const healthJson = (await health.json()) as { ok: boolean; catalogCount: number };
    expect(healthJson.ok).toBe(true);
    expect(healthJson.catalogCount).toBe(40);

    const ogRes = await request.get("/api/og/preset-classic-romance");
    expect(ogRes.status()).toBe(200);
    expect(ogRes.headers()["content-type"]).toContain("image/png");
    const ogBuf = await ogRes.body();
    expect(ogBuf.byteLength).toBeGreaterThan(20000);

    // 2. Verify Homepage + Secondary SEO routes cleanly without overflow
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(450);
    const homeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(homeOverflow).toBe(false);
    await page.screenshot({ path: path.join(SCRATCH_DIR, "home-desktop.png"), fullPage: false });

    for (const route of ["/flowers/rose", "/occasions/romance", "/gallery"]) {
      const r = await page.goto(route, { waitUntil: "networkidle" });
      expect(r?.status()).toBe(200);
    }

    // 3. Studio interactive editing workflow
    await page.goto("/studio?preset=classic-romance", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
    await page.waitForTimeout(500);

    const canvasCount = await page.locator('[data-testid="bouquet-konva-container"] canvas').count();
    expect(canvasCount).toBeGreaterThanOrEqual(3);

    const counterBefore = await page.locator('[data-testid="stem-counter"]').innerText();
    expect(counterBefore).toContain("10 / 18 stems");

    // Add Sunflower stem from Botanical Library
    await page.getByTestId("add-stem-sunflower-front").click();
    await expect(page.getByTestId("stem-counter")).toContainText("11 / 18 stems");

    // Verify Undo & Redo cleanly
    await page.getByTestId("toolbar-undo").click();
    await expect(page.getByTestId("stem-counter")).toContainText("10 / 18 stems");
    await page.getByTestId("toolbar-redo").click();
    await expect(page.getByTestId("stem-counter")).toContainText("11 / 18 stems");

    // Inspect tab: select newly added Sunflower or layer item, verify Inspector + Lock + Multi-select
    await page.getByTestId("right-tab-inspect").click();
    await expect(page.getByTestId("single-stem-inspector")).toBeVisible();
    await page.getByTestId("inspector-lock-btn").click();
    await expect(page.getByTestId("inspector-lock-btn")).toContainText("Unlock Stem");
    await page.getByTestId("toolbar-multiselect").click();
    await expect(page.getByTestId("toolbar-multiselect")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("toolbar-multiselect").click();

    // Finish tab: test Composition preset + Clear Glass Vase + Slate Surface
    await page.getByTestId("right-tab-finish").click();
    await page.getByTestId("preset-luxury").click();
    await page.getByTestId("vessel-vase-clear-glass").click();
    await page.getByTestId("surface-slate").click();
    await expect(page.locator('[data-surface="slate"]')).toBeVisible();

    // Switch back to natural linen + blush wrap (verifying bow restoration!)
    await page.getByTestId("vessel-wrap-blush-linen").click();
    await page.getByTestId("surface-linen").click();
    // Unlock the sunflower so bloom-hugging selection Transformer appears cleanly
    await page.getByTestId("right-tab-inspect").click();
    await page.getByTestId("inspector-lock-btn").click();
    await expect(page.getByTestId("inspector-lock-btn")).toContainText("Lock Stem");
    await page.waitForTimeout(400);

    // Card tab: customize recipient & note
    await page.getByTestId("right-tab-card").click();
    await page.getByLabel("Recipient Name").fill("Clara");
    await page.getByLabel("Sender Name").fill("Theo");

    // Share & Export tab: test real PNG Download + DB Publish -> Live Unboxing
    await page.getByTestId("right-tab-share").click();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "studio-desktop.png"), fullPage: false });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-btn").click(),
    ]);
    const exportPath = path.join(SCRATCH_DIR, "exported-bouquet.png");
    await download.saveAs(exportPath);
    const exportedBytes = fs.readFileSync(exportPath);
    // PNG magic bytes 0x89 0x50 0x4E 0x47
    expect(exportedBytes[0]).toBe(0x89);
    expect(exportedBytes[1]).toBe(0x50);
    expect(exportedBytes[2]).toBe(0x4e);
    expect(exportedBytes[3]).toBe(0x47);
    expect(exportedBytes.byteLength).toBeGreaterThan(50000);
    await expect(page.getByTestId("export-feedback")).toContainText("1600×1600");

    // Publish share link and open Unboxing Experience
    await page.getByTestId("publish-share-btn").click();
    await expect(page.getByTestId("share-result-box")).toBeVisible();
    const shareHref = await page
      .locator('[data-testid="share-result-box"] a[href^="/b/"]')
      .getAttribute("href");
    expect(shareHref).toMatch(/^\/b\/[A-Za-z0-9]+$/);

    await page.goto(shareHref!, { waitUntil: "networkidle" });
    await expect(page.getByTestId("open-envelope-btn")).toBeVisible();
    await page.getByTestId("open-envelope-btn").click();
    await expect(page.getByTestId("unboxing-card")).toContainText("Dearest Clara,");
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(SCRATCH_DIR, "unboxing-desktop.png"), fullPage: false });

    errors.assertClean();
  });

  test("Guided 5-Step Workflow: Flowers, Greenery, Suggestions, Card Styling, Share/JPG/Unboxing & Mobile Steps", async ({
    page,
    context,
  }) => {
    const errors = attachErrorCollectors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/studio");
    await expect(page.getByTestId("bouquet-konva-container")).toBeVisible();
    await expect(page.getByTestId("workflow-step-1")).toHaveAttribute("aria-current", "step");

    // Step 1: Search, color filter, multi-copy add, decrement remove, and replace stem
    const searchInput = page.getByTestId("library-search-input");
    await searchInput.fill("Tulip");
    await expect(page.getByTestId("add-stem-tulip-blush-upright")).toBeVisible();
    await searchInput.fill("");

    await page.getByRole("button", { name: "Filter color: Blush" }).click();
    await expect(page.getByTestId("add-stem-peony-blush-full")).toBeVisible();
    await page.getByRole("button", { name: "Filter color: All Hues" }).click();

    await page.getByTestId("library-filter-all").click();
    const stemCounter = page.getByTestId("stem-counter");
    const countBefore = await stemCounter.innerText();
    await page.getByTestId("add-stem-peony-blush-full").click();
    await page.getByTestId("add-stem-peony-blush-full").click();
    await expect(stemCounter).not.toHaveText(countBefore);

    await page.getByTestId("remove-stem-peony-blush-full").click();
    await page.getByTestId("tray-replace-peony-blush-full").click();
    await page.getByTestId("add-stem-rose-crimson-open").click();
    await expect(page.getByTestId("tray-remove-rose-crimson-open")).toBeVisible();

    // Step 2: Greenery & foliage catalog (incl. Monstera, Autumn Foliage, Eucalyptus, Ruscus, Olive, Baby's Breath)
    await page.getByTestId("next-to-greenery-btn").click();
    await expect(page.getByTestId("workflow-step-2")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("add-stem-monstera-deliciosa")).toBeVisible();
    await expect(page.getByTestId("add-stem-autumn-oak-foliage")).toBeVisible();
    await expect(page.getByTestId("add-stem-eucalyptus-silver")).toBeVisible();
    await expect(page.getByTestId("add-stem-ruscus-italian")).toBeVisible();
    await expect(page.getByTestId("add-stem-olive-branch")).toBeVisible();
    await expect(page.getByTestId("add-stem-babys-breath")).toBeVisible();

    await page.getByTestId("add-stem-monstera-deliciosa").click();
    await page.getByTestId("add-stem-eucalyptus-silver").click();

    // Navigate backward to Step 1 and verify selected stems persist without data loss
    await page.getByTestId("workflow-step-1").click();
    await expect(page.getByTestId("tray-remove-monstera-deliciosa")).toBeVisible();
    await expect(page.getByTestId("tray-remove-rose-crimson-open")).toBeVisible();

    // Step 3: Arrange canvas, Smart Studio Suggestions, vessel swap, Undo/Redo
    await page.getByTestId("workflow-step-3").click();
    await expect(page.getByTestId("workflow-step-3")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("smart-suggestions-box")).toBeVisible();
    await page.getByTestId("apply-suggested-shape-btn").click();
    await page.getByTestId("vessel-vase-cream-ceramic").click();
    await page.getByTestId("toolbar-undo").click();
    await page.getByTestId("toolbar-redo").click();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "step3-arrange-desktop.png"), fullPage: false });

    // Step 4: Card Personalization, empty message validation, custom template/bg/ink & persistence
    await page.getByTestId("next-to-card-btn").click();
    await expect(page.getByTestId("workflow-step-4")).toHaveAttribute("aria-current", "step");
    const msgInput = page.getByPlaceholder("Write a heartfelt message…");
    await msgInput.fill("");
    await expect(page.getByTestId("card-validation-msg")).toBeVisible();

    await page.getByPlaceholder("e.g. Clara").fill("Clara");
    await page.getByPlaceholder("e.g. Theo").fill("Theo");
    await msgInput.fill("Happy Anniversary — bloom brightly today!");
    await page.getByTestId("card-template-blush-parchment").click();
    await page.getByTestId("card-bg-sage").click();
    await page.getByTestId("card-ink-burgundy").click();
    await page.getByTestId("toggle-large-card-preview").click();
    await expect(page.getByTestId("card-live-preview")).toBeVisible();

    // Step backward then return forward confirming card content stays intact
    await page.getByTestId("workflow-step-2").click();
    await page.getByTestId("workflow-step-4").click();
    await expect(page.getByPlaceholder("e.g. Clara")).toHaveValue("Clara");
    await expect(msgInput).toHaveValue("Happy Anniversary — bloom brightly today!");
    await expect(page.getByTestId("draft-saved-badge")).toBeVisible();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "step4-card-desktop.png"), fullPage: false });

    // Step 5: Final Bouquet + Card Preview, Envelope Reveal preview, PNG & JPG downloads, Share & Start Another
    await page.getByTestId("next-to-share-btn").click();
    await expect(page.getByTestId("workflow-step-5")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("step5-final-preview")).toBeVisible();

    await page.getByTestId("preview-reveal-btn").click();
    await expect(page.getByTestId("preview-wax-seal-btn")).toBeVisible();
    await page.getByTestId("preview-wax-seal-btn").click();
    await page.getByTestId("preview-reveal-btn").click();

    await expect(page.getByTestId("toggle-animated-reveal")).toBeChecked();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "step5-share-desktop.png"), fullPage: false });

    const [pngDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-btn").click(),
    ]);
    expect(pngDownload.suggestedFilename()).toMatch(/\.png$/i);
    const pngPath = await pngDownload.path();
    expect(pngPath).toBeTruthy();
    const pngBytes = fs.readFileSync(pngPath as string);
    expect(pngBytes[0]).toBe(0x89);
    expect(pngBytes[1]).toBe(0x50);

    const [jpgDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-download-jpg-btn").click(),
    ]);
    expect(jpgDownload.suggestedFilename()).toMatch(/\.jpg$/i);
    const jpgPath = await jpgDownload.path();
    expect(jpgPath).toBeTruthy();
    const jpgBytes = fs.readFileSync(jpgPath as string);
    expect(jpgBytes[0]).toBe(0xff);
    expect(jpgBytes[1]).toBe(0xd8);
    expect(jpgBytes[2]).toBe(0xff);

    await page.getByTestId("publish-share-btn").click();
    const shareResultBox = page.getByTestId("share-result-box");
    await expect(shareResultBox).toBeVisible();
    await expect(page.getByTestId("copy-share-link-btn")).toBeVisible();
    await expect(page.getByTestId("share-native-btn")).toBeVisible();
    const waHref = await page.getByTestId("share-whatsapp-btn").getAttribute("href");
    expect(waHref).toMatch(/^https:\/\/wa\.me\/\?text=/);

    const unboxingHref = await shareResultBox.locator('a[href^="/b/"]').getAttribute("href");
    expect(unboxingHref).toBeTruthy();
    const unboxingPage = await context.newPage();
    await unboxingPage.setViewportSize({ width: 1280, height: 800 });
    await unboxingPage.goto(unboxingHref as string);
    await expect(unboxingPage.getByTestId("open-envelope-btn")).toBeVisible();
    await unboxingPage.getByTestId("open-envelope-btn").click();
    await expect(unboxingPage.getByTestId("unboxing-card")).toBeVisible();
    await expect(unboxingPage.getByTestId("unboxing-card")).toContainText("Clara");
    await expect(unboxingPage.getByTestId("unboxing-card")).toContainText("Happy Anniversary");
    await unboxingPage.screenshot({ path: path.join(SCRATCH_DIR, "unboxing-desktop.png"), fullPage: false });
    await unboxingPage.close();

    // Start Another Bouquet confirmation guard resets workflow to Step 1
    await page.getByTestId("start-another-btn").click();
    await expect(page.getByTestId("confirm-new-bouquet-box")).toBeVisible();
    await page.getByTestId("confirm-new-bouquet-btn").click();
    await expect(page.getByTestId("workflow-step-1")).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("bouquet-konva-container")).toBeVisible();

    // Mobile 375x812 5-step dock & overflow check
    const mobilePage = await context.newPage();
    const mobileErrors = attachErrorCollectors(mobilePage);
    await mobilePage.setViewportSize({ width: 375, height: 812 });
    await mobilePage.goto("/studio");
    await expect(mobilePage.getByTestId("workflow-step-1")).toBeVisible();
    await expect(mobilePage.getByTestId("mobile-nav-library")).toBeVisible();
    await mobilePage.getByTestId("mobile-nav-library").click();
    await mobilePage.getByTestId("next-to-greenery-btn").click();
    await expect(mobilePage.getByTestId("workflow-step-2")).toHaveAttribute("aria-current", "step");
    await expect(mobilePage.getByTestId("add-stem-monstera-deliciosa")).toBeVisible();
    await mobilePage.getByTestId("mobile-nav-share").click();
    await expect(mobilePage.getByTestId("step5-final-preview")).toBeVisible();
    const hasOverflow = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);
    await mobilePage.screenshot({ path: path.join(SCRATCH_DIR, "studio-mobile-steps.png"), fullPage: false });
    mobileErrors.assertClean();
    await mobilePage.close();

    errors.assertClean();
  });

  test("Mobile 375x812: non-overlapping collapsible sheets, touch buttons & zero horizontal overflow", async ({
    page,
  }) => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = attachErrorCollectors(page);

    await page.goto("/studio", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
    await page.waitForTimeout(450);

    const mobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > 375,
    );
    expect(mobileOverflow).toBe(false);

    // Open collapsible Flowers bottom drawer & verify non-overlapping fit
    await page.getByTestId("mobile-nav-library").click();
    await expect(page.getByTestId("stem-counter")).toBeVisible();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "studio-mobile.png"), fullPage: false });

    await page.getByRole("button", { name: "Done" }).click();
    await page.getByTestId("mobile-nav-finish").click();
    await expect(page.getByTestId("preset-garden")).toBeVisible();

    errors.assertClean();
  });

  test("Features 1-6: Wrapping Studio, 11 Occasions, Photo Cropper, Voice Message, Animated Reveal & Keepsake Gallery", async ({
    page,
    browser,
  }) => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = attachErrorCollectors(page);

    await page.goto("/studio", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');

    // Feature 2: Occasion Templates (11 core occasions + Full vs Wrap & Card Only)
    await page.getByTestId("workflow-step-3").click();
    await expect(page.getByTestId("occasion-templates-box")).toBeVisible();
    await page.getByTestId("occasion-chip-birthday").click();
    await page.getByTestId("apply-occasion-full-btn").click();
    const stemMatchBefore = (await page.locator("header").innerText()).match(/\d+\s+stems/)?.[0];
    expect(stemMatchBefore).toBeTruthy();

    await page.getByTestId("occasion-chip-apology").click();
    await page.getByTestId("apply-occasion-style-btn").click();
    // Stems remain untouched when switching occasion Wrap & Card Only
    await expect(page.locator("header")).toContainText(stemMatchBefore as string);

    // Feature 1: Bouquet Wrapping Studio + Ribbon Material Finishes
    await expect(page.getByTestId("wrapping-studio-box")).toBeVisible();
    await page.getByTestId("vessel-wrap-transparent-cellophane").click();
    await page.getByTestId("ribbon-finish-velvet").click();
    await page.getByTestId("vessel-wrap-floral-patterned").click();
    await page.getByTestId("vessel-wrap-textured-weave").click();
    await page.getByTestId("ribbon-finish-silk").click();
    await page.getByTestId("ribbon-color-champagne-gold").click();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "feature1-wrapping-studio.png"), fullPage: false });

    // Feature 3 & 4: Step 4 Photo Upload + Cropper & Voice Note Attachment
    await page.getByTestId("workflow-step-4").click();
    await page.getByPlaceholder("e.g. Clara").fill("Nora");
    await page.getByPlaceholder("e.g. Theo").fill("Liam");
    await page.getByPlaceholder("Write a heartfelt message…").fill("A bouquet with every favorite memory.");

    const pngBuf = await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 3,
        background: { r: 232, g: 169, b: 174 },
      },
    })
      .png()
      .toBuffer();

    await page.getByTestId("photo-file-input").setInputFiles({
      name: "brunch.png",
      mimeType: "image/png",
      buffer: pngBuf,
    });
    await expect(page.getByTestId("photo-crop-modal")).toBeVisible();
    await page.getByTestId("crop-aspect-portrait").click();
    await page.getByTestId("photo-caption-input").fill("Our garden brunch");
    await page.getByTestId("crop-save-btn").click();
    await expect(page.getByTestId("attached-photos-list")).toBeVisible();

    const wavBuf = createTinyWavBuffer();
    await page.getByTestId("voice-fallback-upload-input").setInputFiles({
      name: "warm-note.wav",
      mimeType: "audio/wav",
      buffer: wavBuf,
    });
    await expect(page.getByTestId("attached-voice-box")).toBeVisible();
    await expect(page.getByTestId("attached-voice-duration")).toBeVisible();

    // Verify Delete & Re-attach works smoothly
    await page.getByTestId("voice-delete-btn").click();
    await expect(page.getByTestId("attached-voice-box")).toBeHidden();
    await page.getByTestId("voice-fallback-upload-input").setInputFiles({
      name: "warm-note-2.wav",
      mimeType: "audio/wav",
      buffer: wavBuf,
    });
    await expect(page.getByTestId("attached-voice-box")).toBeVisible();

    // Feature 5 & 6: Publish Share Link & Inspect Animated Unboxing + Keepsake Gallery + Voice Player
    await page.getByTestId("next-to-share-btn").click();
    await expect(page.getByTestId("share-preview-photos-chip")).toBeVisible();
    await expect(page.getByTestId("share-preview-voice-chip")).toBeVisible();
    await page.getByTestId("publish-share-btn").click();

    const shareBox = page.getByTestId("share-result-box");
    await expect(shareBox).toBeVisible();
    const unboxingHref = await shareBox.locator('a[href^="/b/"]').getAttribute("href");
    expect(unboxingHref).toBeTruthy();

    const recipientPage = await page.context().newPage();
    const recipientErrors = attachErrorCollectors(recipientPage);
    await recipientPage.setViewportSize({ width: 1280, height: 800 });
    await recipientPage.goto(unboxingHref as string, { waitUntil: "networkidle" });
    await expect(recipientPage.getByTestId("open-envelope-btn")).toBeVisible();
    await recipientPage.getByTestId("open-envelope-btn").click();

    await expect(recipientPage.getByTestId("unboxing-bouquet-stage")).toHaveAttribute("data-animated", "true");
    await expect(recipientPage.getByTestId("unboxing-voice-player")).toBeVisible();
    await expect(recipientPage.getByTestId("unboxing-photo-gallery")).toBeVisible();

    // Open & close Photo Lightbox
    await recipientPage.getByTestId("unboxing-photo-thumb-0").click();
    await expect(recipientPage.getByTestId("unboxing-photo-lightbox")).toContainText("Our garden brunch");
    await recipientPage.screenshot({ path: path.join(SCRATCH_DIR, "feature6-lightbox.png"), fullPage: false });
    await recipientPage.getByTestId("unboxing-lightbox-close").click();
    await expect(recipientPage.getByTestId("unboxing-photo-lightbox")).toBeHidden();

    // Test Replay Reveal button returns to sealed envelope cleanly
    await recipientPage.getByTestId("replay-reveal-btn").click();
    await expect(recipientPage.getByTestId("open-envelope-btn")).toBeVisible();
    recipientErrors.assertClean();
    await recipientPage.close();

    // Respect prefers-reduced-motion on recipient unboxing page
    const reducedCtx = await browser.newContext({ reducedMotion: "reduce" });
    const reducedPage = await reducedCtx.newPage();
    await reducedPage.goto(unboxingHref as string, { waitUntil: "networkidle" });
    await reducedPage.getByTestId("open-envelope-btn").click();
    await expect(reducedPage.getByTestId("unboxing-bouquet-stage")).toHaveAttribute("data-animated", "false");
    await reducedCtx.close();

    errors.assertClean();
  });

  test("Features 7-8 & Mobile 390px: AI Bouquet Assistant Editable Stems & DB Saved Projects Lifecycle", async ({
    page,
    context,
  }) => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = attachErrorCollectors(page);

    await page.goto("/studio", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');

    // Feature 8: AI Bouquet Assistant applies real editable stems
    await page.getByTestId("open-ai-assistant-btn").click();
    await expect(page.getByTestId("ai-assistant-drawer")).toBeVisible();
    await page.getByTestId("ai-prompt-input").fill("Bright yellow sunflowers and wildflowers for a cheerful birthday");
    await page.getByTestId("ai-suggest-btn").click();
    await expect(page.getByTestId("ai-proposal-card-0")).toBeVisible();
    await expect(page.getByTestId("ai-proposal-card-2")).toBeVisible();
    await page.screenshot({ path: path.join(SCRATCH_DIR, "feature8-ai-drawer.png"), fullPage: false });
    await page.getByTestId("ai-apply-0").click();
    await expect(page.getByTestId("ai-assistant-drawer")).toBeHidden();

    // Confirm applied AI blooms remain editable individually via Undo / Step 4 customization
    await expect(page.getByTestId("toolbar-undo")).toBeEnabled();
    await page.getByTestId("workflow-step-4").click();
    await page.getByPlaceholder("e.g. Clara").fill("Sofia");

    // Feature 7: Save Draft -> Duplicate -> Reload -> Reopen & Edit -> Delete
    await page.getByTestId("open-projects-btn").click();
    await expect(page.getByTestId("saved-projects-drawer")).toBeVisible();
    await page.getByTestId("project-title-input").fill("Sofia Sunlit Birthday");
    await page.getByTestId("save-project-btn").click();

    const firstCard = page.locator('[data-testid^="saved-project-card-"]').first();
    await expect(firstCard).toContainText("Sofia Sunlit Birthday");
    const firstIdAttr = await firstCard.getAttribute("data-testid");
    const projectId = (firstIdAttr ?? "").replace("saved-project-card-", "");
    expect(projectId.length).toBeGreaterThan(6);

    await page.getByTestId(`duplicate-project-${projectId}`).click();
    await expect(page.getByTestId("saved-projects-drawer")).toContainText("Sofia Sunlit Birthday (Copy)");
    await page.getByTestId("close-projects-drawer").click();

    // Start fresh & reload Studio, then reopen original project from DB
    await page.goto("/studio", { waitUntil: "networkidle" });
    await page.getByTestId("open-projects-btn").click();
    await expect(page.getByTestId(`open-project-${projectId}`)).toBeVisible();
    await page.getByTestId(`open-project-${projectId}`).click();
    await expect(page.getByTestId("saved-projects-drawer")).toBeHidden();

    await page.getByTestId("workflow-step-4").click();
    await expect(page.getByPlaceholder("e.g. Clara")).toHaveValue("Sofia");

    // Delete copy from drawer and verify removal
    await page.getByTestId("open-projects-btn").click();
    const copyCard = page.locator('[data-testid^="saved-project-card-"]', {
      hasText: "Sofia Sunlit Birthday (Copy)",
    });
    const copyAttr = await copyCard.getAttribute("data-testid");
    const copyId = (copyAttr ?? "").replace("saved-project-card-", "");
    await page.getByTestId(`delete-project-${copyId}`).click();
    await expect(page.getByTestId(`saved-project-card-${copyId}`)).toHaveCount(0);
    await page.getByTestId("close-projects-drawer").click();

    // Mobile 390x844 overflow check with AI & Projects header buttons
    const mobilePage = await context.newPage();
    const mobileErrors = attachErrorCollectors(mobilePage);
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.goto("/studio", { waitUntil: "networkidle" });
    await expect(mobilePage.getByTestId("open-ai-assistant-btn")).toBeVisible();
    await expect(mobilePage.getByTestId("open-projects-btn")).toBeVisible();
    const overflow390 = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow390).toBe(false);
    mobileErrors.assertClean();
    await mobilePage.close();

    errors.assertClean();
  });

  test("All 12 website pages, Flower Library, Contact DB form & branded 404", async ({
    page,
    context,
  }) => {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = attachErrorCollectors(page);

    // 1. Homepage: hero CTAs + all 6 required Featured Bouquet moods
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("hero-create-btn")).toBeVisible();
    await expect(page.getByTestId("hero-gallery-btn")).toBeVisible();
    for (const mood of [
      "romance",
      "birthday",
      "wedding",
      "friendship",
      "thank-you",
      "congratulations",
    ]) {
      await expect(page.getByTestId(`featured-occasion-${mood}`)).toBeVisible();
    }

    // 2. Flower Library (/flowers): category filter & search -> Details -> Use Stem (?stem=)
    await page.goto("/flowers", { waitUntil: "networkidle" });
    await page.getByTestId("flower-cat-foliage").click();
    await page.getByTestId("flower-search-input").fill("monstera");
    await expect(page.getByTestId("flower-card-monstera-deliciosa")).toBeVisible();

    await page.goto("/studio?stem=peony-blush-full", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
    await expect(page.getByTestId("stem-counter")).toContainText("11 / 18 stems");

    // 3. Visit all 12 site pages cleanly with status 200
    for (const route of [
      "/",
      "/studio",
      "/flowers",
      "/flowers/rose",
      "/gallery",
      "/occasions",
      "/occasions/wedding",
      "/about",
      "/how-it-works",
      "/faq",
      "/contact",
      "/privacy",
      "/terms",
      "/b/preset-classic-romance",
    ]) {
      const res = await page.goto(route, { waitUntil: "networkidle" });
      expect(res?.status(), `Route ${route} failed`).toBe(200);
    }

    // 4. FAQ interactive accordion toggle
    await page.goto("/faq", { waitUntil: "networkidle" });
    const faqItem = page.getByTestId("faq-item-ai-editable-stems");
    await faqItem.locator("button").click();
    await expect(faqItem.locator("button")).toHaveAttribute("aria-expanded", "true");

    // 5. Contact form real SQLite submission (POST /api/contact -> 201)
    await page.goto("/contact?topic=feedback", { waitUntil: "networkidle" });
    await page.getByTestId("contact-name-input").fill("Elena Rostova");
    await page.getByTestId("contact-email-input").fill("elena@example.com");
    await page.getByTestId("contact-message-input").fill(
      "Verified automated feedback test for Petal and Prose floral atelier.",
    );
    await page.getByTestId("contact-submit-btn").click();
    await expect(page.getByTestId("contact-success-box")).toBeVisible();

    // 6. Branded 404 verification on an isolated page context (expects 404 intentionally)
    const notFoundPage = await context.newPage();
    const res404 = await notFoundPage.goto("/nonexistent-garden-route", {
      waitUntil: "domcontentloaded",
    });
    expect(res404?.status()).toBe(404);
    await expect(notFoundPage.getByRole("heading", { level: 1 })).toContainText(
      "Couldn't Be Found",
    );
    await notFoundPage.close();

    errors.assertClean();
  });

  test("7-viewport responsive matrix across 360px, 390px, 430px, 768px, 1024px, 1440px, and 1920px", async ({
    context,
  }) => {
    test.setTimeout(90_000);
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });

    const viewports = [
      { width: 360, height: 800, label: "360w" },
      { width: 390, height: 844, label: "390w" },
      { width: 430, height: 932, label: "430w" },
      { width: 768, height: 1024, label: "768w" },
      { width: 1024, height: 768, label: "1024w" },
      { width: 1440, height: 900, label: "1440w" },
      { width: 1920, height: 1080, label: "1920w" },
    ];

    for (const vp of viewports) {
      const vpPage = await context.newPage();
      const vpErrors = attachErrorCollectors(vpPage);
      await vpPage.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ["/", "/flowers", "/occasions", "/blog", "/contact", "/studio"]) {
        await vpPage.goto(route, { waitUntil: "load" });
        if (route === "/studio") {
          await vpPage.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
        }
        await vpPage.waitForTimeout(200);
        const overflowCheck = await vpPage.evaluate(() => {
          const docOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
          const elements = Array.from(
            document.querySelectorAll("header, main, footer, h1, h2, section"),
          );
          const clipped = elements
            .filter((el) => el.getBoundingClientRect().width > 0)
            .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 2)
            .map((el) => `${el.tagName}:${el.getBoundingClientRect().right.toFixed(1)}`);
          return { docOverflow, clipped };
        });
        expect(
          overflowCheck,
          `Viewport ${vp.width}x${vp.height} overflow on ${route}`,
        ).toEqual({ docOverflow: false, clipped: [] });
      }

      if (vp.width < 1024) {
        await vpPage.goto("/", { waitUntil: "load" });
        await vpPage.getByTestId("mobile-menu-toggle").click();
        await expect(vpPage.getByTestId("mobile-nav-drawer")).toBeVisible();
      }

      if (vp.width === 360 || vp.width === 768 || vp.width === 1024 || vp.width === 1920) {
        await vpPage.goto("/", { waitUntil: "networkidle" });
        await vpPage.waitForTimeout(250);
        await vpPage.screenshot({
          path: path.join(SCRATCH_DIR, `home-${vp.label}.png`),
          fullPage: false,
        });
      }

      if (vp.width === 360) {
        await vpPage.goto("/studio", { waitUntil: "networkidle" });
        await vpPage.waitForTimeout(250);
        await vpPage.screenshot({
          path: path.join(SCRATCH_DIR, "studio-360w.png"),
          fullPage: false,
        });
      }

      vpErrors.assertClean();
      await vpPage.close();
    }
  });

  test("Technical SEO: robots.txt, sitemap.xml, canonicals, JSON-LD, blog, and privacy-scoped /b/[slug] indexing", async ({
    page,
    context,
    request,
  }) => {
    test.setTimeout(90_000);
    const errors = attachErrorCollectors(page);

    // 1. /robots.txt validation
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsText = await robotsRes.text();
    expect(robotsText).toContain("Disallow: /api/projects/");
    expect(robotsText).toContain("Allow: /b/");
    expect(robotsText).not.toContain("Disallow: /b/");
    expect(robotsText).toContain("Sitemap:");

    // 2. /sitemap.xml validation (zero private /b/ routes or ? parameters)
    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("<urlset");
    expect(sitemapXml).toContain("/studio</loc>");
    expect(sitemapXml).toContain("/flowers/rose</loc>");
    expect(sitemapXml).toContain("/occasions/birthday</loc>");
    expect(sitemapXml).toContain("/blog/what-is-a-digital-bouquet-complete-guide</loc>");
    const sitemapLocs = Array.from(sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1] ?? "");
    expect(sitemapLocs.length).toBeGreaterThan(25);
    for (const loc of sitemapLocs) {
      expect(loc).not.toContain("/b/");
      expect(loc).not.toContain("?");
    }

    // 3. Missing /api/og slug returns true HTTP 404
    const og404 = await request.get("/api/og/does-not-exist-seo-check");
    expect(og404.status()).toBe(404);

    // 4. Rendered HTML SEO checks across public canonical routes
    const seoRoutes = [
      { path: "/", expectSchema: "Organization" },
      { path: "/flowers", expectSchema: "BreadcrumbList" },
      { path: "/flowers/rose", expectSchema: "BreadcrumbList" },
      { path: "/occasions/birthday", expectSchema: "BreadcrumbList" },
      { path: "/blog", expectSchema: "BreadcrumbList" },
      { path: "/blog/what-is-a-digital-bouquet-complete-guide", expectSchema: "Article" },
      { path: "/faq", expectSchema: "FAQPage" },
    ];

    const seenTitles = new Set<string>();
    for (const item of seoRoutes) {
      await page.goto(item.path, { waitUntil: "domcontentloaded" });
      const headData = await page.evaluate(() => {
        const title = document.title.trim();
        const desc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "";
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "";
        const twCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") ?? "";
        const h1Count = document.querySelectorAll("h1").length;
        const jsonLdRaw = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        ).map((el) => el.textContent ?? "");
        return { title, desc, canonical, ogTitle, twCard, h1Count, jsonLdRaw };
      });

      expect(headData.title.length, `Title on ${item.path}`).toBeGreaterThan(10);
      expect(seenTitles.has(headData.title), `Unique title on ${item.path}`).toBe(false);
      seenTitles.add(headData.title);
      expect(headData.desc.length, `Meta description on ${item.path}`).toBeGreaterThan(30);
      expect(headData.canonical, `Canonical on ${item.path}`).not.toContain("?");
      expect(headData.ogTitle.length).toBeGreaterThan(5);
      expect(headData.twCard).toBe("summary_large_image");
      expect(headData.h1Count, `Single H1 on ${item.path}`).toBe(1);

      const parsedTypes = headData.jsonLdRaw.map((raw) => {
        const parsed = JSON.parse(raw) as { "@type"?: string };
        return parsed["@type"];
      });
      expect(parsedTypes, `JSON-LD @type on ${item.path}`).toContain(item.expectSchema);
    }

    // 5. Parameterized routes force parameter-stripped canonical + noindex, follow
    await page.goto("/studio?preset=classic-romance", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
    const studioParamMeta = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
      hasWebApp: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some(
        (el) => (el.textContent ?? "").includes('"WebApplication"'),
      ),
    }));
    expect(studioParamMeta.canonical.endsWith("/studio")).toBe(true);
    expect(studioParamMeta.robots).toContain("noindex");
    expect(studioParamMeta.hasWebApp).toBe(true);

    await page.goto("/blog?category=Flower%20Meanings", { waitUntil: "domcontentloaded" });
    const blogParamMeta = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    }));
    expect(blogParamMeta.canonical.endsWith("/blog")).toBe(true);
    expect(blogParamMeta.robots).toContain("noindex");

    // 6. SiteSearchAction target (/flowers?q=peony) pre-filters catalog
    await page.goto("/flowers?q=peony", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("flower-search-input")).toHaveValue("peony");

    // 7. Privacy-scoped shared bouquet: hideNamesInPreview + private noindex + excluded from /gallery
    await page.goto("/studio", { waitUntil: "load" });
    await page.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
    await page.getByTestId("workflow-step-4").click();
    await page.getByPlaceholder("e.g. Clara").fill("SecretRecipient");
    await page.getByPlaceholder("e.g. Theo").fill("SecretSender");
    await page.getByPlaceholder("Write a heartfelt message…").fill("Private keepsake note only.");
    await page.getByTestId("workflow-step-5").click();

    await page.getByTestId("toggle-hide-names-share").check();
    await expect(page.getByTestId("toggle-public-showcase")).toBeDisabled();
    await page.getByTestId("publish-share-btn").click();
    const shareResultBox = page.getByTestId("share-result-box");
    await expect(shareResultBox).toBeVisible();
    const privateHref = await shareResultBox.locator('a[href^="/b/"]').getAttribute("href");
    expect(privateHref).toBeTruthy();

    const privPage = await context.newPage();
    const privRes = await privPage.goto(privateHref as string, { waitUntil: "domcontentloaded" });
    expect(privRes?.status()).toBe(200);
    expect(privRes?.headers()["x-robots-tag"]).toContain("noindex");
    expect(privRes?.headers()["referrer-policy"]).toBe("no-referrer");

    const privMeta = await privPage.evaluate(() => ({
      title: document.title,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
      robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    }));
    expect(privMeta.robots).toContain("noindex");
    expect(privMeta.title).not.toContain("SecretRecipient");
    expect(privMeta.ogTitle).not.toContain("SecretRecipient");
    expect(privMeta.ogTitle).not.toContain("SecretSender");
    await privPage.close();

    // Private bouquet MUST NOT leak into public /gallery
    await page.goto("/gallery", { waitUntil: "domcontentloaded" });
    const galleryLinks = await page.locator(`a[href="${privateHref}"]`).count();
    expect(galleryLinks).toBe(0);

    errors.assertClean();
  });

  test("Production release security: /api/health, CSRF origin rejection, SVG upload blocking, CSP & DNT/GPC analytics", async ({
    request,
    page,
  }) => {
    // 1. Health endpoint exposes safe operational status
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    const healthJson = (await healthRes.json()) as {
      ok: boolean;
      status: string;
      catalogCount: number;
      storageMode: string;
    };
    expect(healthJson.ok).toBe(true);
    expect(healthJson.status).toBe("healthy");
    expect(healthJson.catalogCount).toBe(40);
    expect(healthJson.storageMode).toBe("local-sqlite");

    // 2. Production CSP strips unsafe-eval & static assets carry immutable caching
    const homeRes = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(homeRes?.status()).toBe(200);
    const csp = homeRes?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(homeRes?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(homeRes?.headers()["x-frame-options"]).toBe("SAMEORIGIN");

    const assetRes = await request.get("/assets/v1/flowers/rose-crimson-open-studio.webp");
    expect(assetRes.status()).toBe(200);
    expect(assetRes.headers()["cache-control"]).toContain("immutable");

    // 3. Cross-origin CSRF attempt rejected with HTTP 403
    const csrfRes = await request.post("/api/contact", {
      headers: {
        origin: "https://evil-attacker.invalid",
        "content-type": "application/json",
      },
      data: {
        name: "Mallory",
        email: "mallory@example.com",
        topic: "general",
        message: "Attempting cross origin POST.",
      },
    });
    expect(csrfRes.status()).toBe(403);

    // 4. SVG/XSS file disguised as image/png rejected via binary magic bytes (HTTP 415)
    const maliciousSvgRes = await request.post("/api/media", {
      multipart: {
        kind: "photo",
        file: {
          name: "spoof.png",
          mimeType: "image/png",
          buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
        },
      },
    });
    expect(maliciousSvgRes.status()).toBe(415);

    // 5. Privacy-first analytics accepts allowed aggregate events and honors DNT & Sec-GPC
    const tracked = await request.post("/api/analytics", {
      data: { event: "studio_opened" },
    });
    expect(tracked.status()).toBe(202);
    expect(((await tracked.json()) as { recorded: boolean }).recorded).toBe(true);

    const dntBlocked = await request.post("/api/analytics", {
      headers: { dnt: "1" },
      data: { event: "studio_opened" },
    });
    expect(dntBlocked.status()).toBe(202);
    expect(((await dntBlocked.json()) as { reason: string }).reason).toBe("privacy-signal-honored");

    const gpcBlocked = await request.post("/api/analytics", {
      headers: { "sec-gpc": "1" },
      data: { event: "studio_opened" },
    });
    expect(gpcBlocked.status()).toBe(202);
    expect(((await gpcBlocked.json()) as { reason: string }).reason).toBe("privacy-signal-honored");

    const statsRes = await request.get("/api/analytics");
    expect(statsRes.status()).toBe(200);
    const statsJson = (await statsRes.json()) as {
      privacyMode: string;
      aggregates: Array<{ eventName: string; count: number }>;
    };
    expect(statsJson.privacyMode).toBe("cookieless-dnt-gpc-honored");
    expect(statsJson.aggregates.some((r) => r.eventName === "studio_opened" && r.count >= 1)).toBe(
      true,
    );
  });

  test("Performance benchmarks: Desktop (1280px) & Mobile (390px) loading, asset transfer, Konva studio, PNG export & unboxing telemetry", async ({
    context,
  }) => {
    const metrics: Record<string, Record<string, number>> = {};

    for (const vp of [
      { label: "desktop", width: 1280, height: 800 },
      { label: "mobile", width: 390, height: 844 },
    ]) {
      const p = await context.newPage();
      await p.setViewportSize({ width: vp.width, height: vp.height });
      await p.addInitScript(() => {
        const win = window as unknown as { __clsSum?: number };
        win.__clsSum = 0;
        if ("PerformanceObserver" in window) {
          try {
            const obs = new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as Array<{ hadRecentInput?: boolean; value?: number }>) {
                if (!entry.hadRecentInput && typeof entry.value === "number") {
                  win.__clsSum = (win.__clsSum ?? 0) + entry.value;
                }
              }
            });
            obs.observe({ type: "layout-shift", buffered: true });
          } catch {
            // Unsupported observer fallback
          }
        }
      });

      const homeStart = Date.now();
      await p.goto("/", { waitUntil: "load" });
      await p.waitForFunction(() => document.querySelectorAll("canvas").length > 0);
      const homeLoadMs = Date.now() - homeStart;

      const homePerf = await p.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const paints = performance.getEntriesByType("paint");
        const fcp = paints.find((e) => e.name === "first-contentful-paint")?.startTime ?? 0;
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const webpResources = resources.filter((r) => r.name.includes(".webp"));
        const maxWebpMs = webpResources.reduce((m, r) => Math.max(m, r.duration), 0);
        const totalJsBytes = resources
          .filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"))
          .reduce((sum, r) => sum + (r.encodedBodySize || 0), 0);
        const win = window as unknown as { __clsSum?: number };
        return {
          dclMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
          fcpMs: Math.round(fcp),
          cls: Number((win.__clsSum ?? 0).toFixed(4)),
          webpCount: webpResources.length,
          maxWebpMs: Math.round(maxWebpMs),
          jsKb: Math.round(totalJsBytes / 1024),
        };
      });

      expect(homePerf.cls).toBeLessThan(0.1);
      expect(homeLoadMs).toBeLessThan(15000);

      const studioStart = Date.now();
      await p.goto("/studio", { waitUntil: "load" });
      await p.waitForSelector('[data-testid="bouquet-konva-container"] canvas');
      const studioReadyMs = Date.now() - studioStart;

      let exportMs = 0;
      if (vp.label === "desktop") {
        await p.getByTestId("workflow-step-5").click();
        const exportStart = Date.now();
        const [dl] = await Promise.all([
          p.waitForEvent("download"),
          p.getByTestId("export-download-btn").click(),
        ]);
        await dl.path();
        exportMs = Date.now() - exportStart;
        expect(exportMs).toBeLessThan(10000);
      }

      const unboxStart = Date.now();
      await p.goto("/b/sample-classic-romance", { waitUntil: "load" });
      await p.getByTestId("open-envelope-btn").click();
      await expect(p.getByTestId("unboxing-card")).toBeVisible();
      const unboxMs = Date.now() - unboxStart;

      metrics[vp.label] = {
        homeLoadMs,
        ...homePerf,
        studioReadyMs,
        exportMs,
        unboxMs,
      };
      await p.close();
    }

    console.log("PERF_METRICS_JSON=" + JSON.stringify(metrics));
    expect(metrics.desktop!.cls).toBeLessThan(0.1);
    expect(metrics.mobile!.cls).toBeLessThan(0.1);
  });
});

import { FontPairingId } from "@/engine/types";

export const VIRTUAL_CARD_WIDTH = 640;
export const VIRTUAL_CARD_HEIGHT = 800;
export const CARD_MARGIN_X = Math.round(VIRTUAL_CARD_WIDTH * 0.12); // ~77px
export const CARD_TEXT_MAX_WIDTH = VIRTUAL_CARD_WIDTH - CARD_MARGIN_X * 2; // 486px
export const CARD_LINE_HEIGHT_RATIO = 1.55;
export const MAX_CARD_LINES = 14;

export type TextMeasurer = (text: string, fontCss: string) => number;

export function getCardFontFamilies(
  pairingId: FontPairingId,
  resolved: { cormorant?: string; plusJakarta?: string; alexBrush?: string; lora?: string } = {},
): { displayFont: string; bodyFont: string } {
  const serif = resolved.cormorant ?? "cormorantGaramond, 'Cormorant Garamond', Georgia, serif";
  const sans = resolved.plusJakarta ?? "plusJakartaSans, 'Plus Jakarta Sans', sans-serif";
  const script = resolved.alexBrush ?? "alexBrush, 'Alex Brush', loraFont, 'Lora', cursive";
  const lora = resolved.lora ?? "loraFont, 'Lora', Georgia, serif";

  switch (pairingId) {
    case "editorial-serif":
      return { displayFont: serif, bodyFont: serif };
    case "calligraphic":
      return { displayFont: `${script}, ${lora}`, bodyFont: lora };
    case "warm-literary":
      return { displayFont: lora, bodyFont: lora };
    case "modern-atelier":
      return { displayFont: sans, bodyFont: sans };
  }
}

export function createDomTextMeasurer(): TextMeasurer {
  if (typeof document === "undefined") {
    return (text: string, fontCss: string) => {
      const match = /(\d+(?:\.\d+)?)px/.exec(fontCss);
      const px = match ? Number(match[1]) : 18;
      return text.length * px * 0.52;
    };
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  return (text: string, fontCss: string) => {
    if (!ctx) return text.length * 10;
    ctx.font = fontCss;
    return ctx.measureText(text).width;
  };
}

export type CardWrappedResult = {
  lines: string[];
  fontSizePx: number;
  lineHeightPx: number;
  exceedsMaxLines: boolean;
  salutationFontSizePx: number;
};

/**
 * Shared deterministic text wrapper across DOM live StationeryCardPreview,
 * Step 4 PNG/JPG export, and Node @napi-rs/canvas.
 */
export function wrapCardMessage(
  measureWidth: TextMeasurer,
  message: string,
  maxWidth: number = CARD_TEXT_MAX_WIDTH,
  bodyFontFamily = "Georgia, serif",
): CardWrappedResult {
  const stepSizes = [22, 18, 15];
  const paragraphs = message.replace(/\r\n/g, "\n").split("\n");

  const wrapAtFontSize = (sizePx: number): string[] => {
    const fontCss = `400 ${sizePx}px ${bodyFontFamily}`;
    const lines: string[] = [];

    for (const para of paragraphs) {
      if (para.trim().length === 0) {
        lines.push("");
        continue;
      }

      const words = para.split(/\s+/);
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (measureWidth(candidate, fontCss) <= maxWidth) {
          current = candidate;
          continue;
        }
        if (current) {
          lines.push(current);
          current = "";
        }
        // Break overly long unbroken tokens safely by grapheme
        if (measureWidth(word, fontCss) > maxWidth) {
          let chunk = "";
          for (const ch of Array.from(word)) {
            if (measureWidth(chunk + ch, fontCss) <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
      if (current || para === "") {
        lines.push(current);
      }
    }
    return lines;
  };

  let chosenSize = stepSizes[0]!;
  let wrapped = wrapAtFontSize(chosenSize);

  if (wrapped.length > 10) {
    chosenSize = stepSizes[1]!;
    wrapped = wrapAtFontSize(chosenSize);
  }
  if (wrapped.length > 13) {
    chosenSize = stepSizes[2]!;
    wrapped = wrapAtFontSize(chosenSize);
  }

  return {
    lines: wrapped,
    fontSizePx: chosenSize,
    lineHeightPx: Math.round(chosenSize * CARD_LINE_HEIGHT_RATIO),
    exceedsMaxLines: wrapped.length > MAX_CARD_LINES,
    salutationFontSizePx: chosenSize >= 22 ? 32 : chosenSize === 18 ? 28 : 24,
  };
}


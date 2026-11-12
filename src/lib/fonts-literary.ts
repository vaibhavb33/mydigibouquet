import localFont from "next/font/local";

export const loraFont = localFont({
  src: [
    {
      path: "../fonts/lora-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "../fonts/lora-italic-latin.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  variable: "--font-lora",
});


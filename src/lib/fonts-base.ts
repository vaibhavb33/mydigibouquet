import localFont from "next/font/local";

export const cormorantGaramond = localFont({
  src: [
    {
      path: "../fonts/cormorant-garamond-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
    {
      path: "../fonts/cormorant-garamond-italic-latin.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  display: "swap",
  adjustFontFallback: "Times New Roman",
  variable: "--font-cormorant",
});

export const plusJakartaSans = localFont({
  src: [
    {
      path: "../fonts/plus-jakarta-sans-latin.woff2",
      weight: "400 600",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  variable: "--font-plus-jakarta",
});


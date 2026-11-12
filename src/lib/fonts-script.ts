import localFont from "next/font/local";

export const alexBrush = localFont({
  src: [
    {
      path: "../fonts/alex-brush-latin.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  variable: "--font-alex-brush",
});


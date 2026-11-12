import { Lora } from "next/font/google";

export const loraFont = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lora",
});


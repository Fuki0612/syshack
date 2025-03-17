import { Noto_Sans_JP, Dela_Gothic_One } from "next/font/google";

export const notojp = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const delagothicone = Dela_Gothic_One({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
});
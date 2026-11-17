import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { pageMetadata } from "@/config/seo";
import "./globals.css";

const instrument = localFont({
  src: "./fonts/instrument-sans-latin.woff2",
  variable: "--font-instrument",
  display: "swap",
  weight: "400 700",
});

export const metadata: Metadata = {
  ...pageMetadata("Forum ENSAM Rabat 2026 | Forum Industriel ENSAM-R", "Forum ENSAM Rabat 2026 : rendez-vous les 2 et 3 décembre à l’ENSAM Rabat pour deux journées de panels et de rencontres entre étudiants, ingénieurs et entreprises.", "/"),
  metadataBase: new URL("https://forumensamrabat.com"),
  robots: { index: true, follow: true },
  icons: {
    icon: "/assets/forum-ensam-r-logo.png",
  },
};

export const viewport: Viewport = { themeColor: "#0B1736", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" className={instrument.variable}><head><link rel="preload" as="image" href="/assets/ensam-rabat-universe.png" fetchPriority="high" /></head><body>{children}</body></html>;
}

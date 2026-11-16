import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { experienceConfig } from "@/config/experience";
import "./globals.css";

const instrument = localFont({
  src: "./fonts/instrument-sans-latin.woff2",
  variable: "--font-instrument",
  display: "swap",
  weight: "400 700",
});

export const metadata: Metadata = {
  title: `${experienceConfig.projectName} — ${experienceConfig.invitation.title.join(" ")}`,
  description: experienceConfig.hero.description,
  robots: { index: false, follow: false },
  icons: {
    icon: "/assets/forum-ensam-r-logo.png",
  },
};

export const viewport: Viewport = { themeColor: "#0B1736", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" className={instrument.variable}><head><link rel="preload" as="image" href="/assets/ensam-rabat-universe.png" fetchPriority="high" /></head><body>{children}</body></html>;
}

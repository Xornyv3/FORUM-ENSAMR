import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata("Programme | Forum ENSAM Rabat 2026", "Découvrez le programme du Forum ENSAM Rabat les 2 et 3 décembre 2026 : panels, rencontres avec les entreprises et échanges entre étudiants et ingénieurs.", "/programme");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

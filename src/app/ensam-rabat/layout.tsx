import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata("ENSAM Rabat | Forum ENSAM Rabat 2026", "Découvrez l’ENSAM Rabat, l’école qui accueille le Forum Industriel ENSAM-R les 2 et 3 décembre 2026, au croisement de la formation et de l’industrie.", "/ensam-rabat");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

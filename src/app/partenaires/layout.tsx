import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata("Devenir partenaire | Forum ENSAM Rabat 2026", "Devenez partenaire ou sponsor du Forum ENSAM Rabat 2026. Rencontrez les futurs ingénieurs et échangez avec l’équipe sur votre participation.", "/partenaires");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

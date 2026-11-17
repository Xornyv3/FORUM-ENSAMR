import type { ReactNode } from "react";
import { pageMetadata } from "@/config/seo";

export const metadata = pageMetadata("Panels | Forum ENSAM Rabat 2026", "Les trois panels du Forum ENSAM Rabat 2026 : souveraineté numérique et IA, énergie et eau, compétences et transformation de l’ingénieur marocain.", "/panels");

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

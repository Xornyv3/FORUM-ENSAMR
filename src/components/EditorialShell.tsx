import Link from "next/link";
import type { ReactNode } from "react";
import { EditorialMenu } from "./EditorialMenu";

type EditorialShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  visual?: ReactNode;
};

export function EditorialShell({ eyebrow, title, intro, children, visual }: EditorialShellProps) {
  return (
    <main className="editorial-page">
      <header className="editorial-header">
        <Link className="editorial-brand" href="/" aria-label="Retour à l’accueil Forum ENSAM-R">
          <img src="/assets/forum-ensam-r-logo.png" alt="" width="42" height="42" />
          <span>FORUM ENSAM-R</span>
        </Link>
        <nav className="editorial-nav" aria-label="Navigation éditoriale">
          <Link href="/programme">Programme</Link>
          <Link href="/panels">Panels</Link>
          <Link href="/ensam-rabat">ENSAM Rabat</Link>
          <Link href="/partenaires">Partenaires</Link>
          <Link className="editorial-back" href="/">Retour à l’accueil <span aria-hidden="true">↗</span></Link>
        </nav>
        <EditorialMenu />
      </header>
      <section className="editorial-hero">
        <div className="editorial-hero-copy">
          <p className="editorial-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="editorial-intro">{intro}</p>
        </div>
        {visual ?<div className="editorial-hero-visual">{visual}</div> : null}
      </section>
      <div className="editorial-rule" />
      <section className="editorial-content">{children}</section>
      <footer className="editorial-footer">
        <span>FORUM ENSAM-R · RABAT · 2026</span>
        <Link href="/">Revenir à l’accueil <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}

export function SectionHeading({ index, title, children }: { index: string; title: string; children?: ReactNode }) {
  return (
    <div className="editorial-section-heading">
      <span>{index}</span>
      <div><h2>{title}</h2>{children ?<p>{children}</p> : null}</div>
    </div>
  );
}

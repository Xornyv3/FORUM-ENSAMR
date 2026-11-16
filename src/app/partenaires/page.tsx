"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { EditorialMenu } from "@/components/EditorialMenu";

export default function PartenairesPage() {
  const contactDialog = useRef<HTMLDialogElement>(null);
  const [contactStatus, setContactStatus] = useState("idle");

  function submitContactForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string") data.set(key, value);
    }
    data.set("_subject", "Nouvelle prise de contact — Forum ENSAM-R");
    setContactStatus("sending");
    void fetch("https://formsubmit.co/ajax/alaguiabdoullah@gmail.com", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: data,
    }).catch(() => undefined);
    window.setTimeout(() => {
      setContactStatus("Message envoyé avec succès.");
      form.reset();
    }, 2200);
  }

  return (
    <main className="partners-page">
      <header className="partners-header">
        <Link className="partners-brand" href="/" aria-label="Retour à l’accueil Forum ENSAM-R">
          <img src="/assets/forum-ensam-r-logo.png" alt="" width="42" height="42" />
          <span>FORUM ENSAM-R</span>
        </Link>
        <nav aria-label="Navigation partenaires">
          <Link href="/programme">Programme</Link>
          <Link href="/panels">Panels</Link>
          <Link href="/ensam-rabat">ENSAM Rabat</Link>
          <Link href="/partenaires">Partenaires</Link>
          <Link href="/">Retour à l’accueil <span aria-hidden="true">↗</span></Link>
        </nav>
        <EditorialMenu />
      </header>

      <section className="partners-hero">
        <div className="partners-hero-copy">
          <p className="partners-eyebrow">RÉSEAU / INDUSTRIE / IMPACT</p>
          <h1>Ils nous ont fait confiance.</h1>
          <p>Un forum construit avec celles et ceux qui transforment les idées en systèmes, en métiers et en futurs concrets.</p>
        </div>
        <div className="partners-number" aria-label="52 entreprises"><span>52</span><small>entreprises</small></div>
      </section>

      <section className="partners-proof">
        <div className="partners-proof-heading"><h2>Un écosystème<br /><em>en mouvement.</em></h2><p>De l’industrie automobile à l’énergie, du conseil à la santé : une constellation d’acteurs engagés aux côtés de la nouvelle génération d’ingénieurs.</p></div>
        <figure className="partners-collage"><img src="/assets/partenaires-logos.jpeg" alt="Logos des entreprises partenaires du Forum ENSAM-R" /><figcaption>Entreprises partenaires du Forum ENSAM-R</figcaption></figure>
      </section>

      <section className="partners-cta">
        <div><p className="partners-eyebrow">DEVENIR PARTENAIRE</p><h2>Votre logo peut<br /><em>rejoindre la constellation.</em></h2></div>
        <button type="button" className="partners-action" onClick={() => { setContactStatus("idle"); contactDialog.current?.showModal(); }}>Parler avec l’équipe <span aria-hidden="true">↗</span></button>
      </section>

      <footer className="partners-footer"><span>FORUM ENSAM-R · RABAT · 2026</span><Link href="/">Revenir à l’accueil <span aria-hidden="true">↗</span></Link></footer>
      <dialog ref={contactDialog} className="contact-dialog" onClick={(event) => { if (event.target === event.currentTarget) contactDialog.current?.close(); }} aria-labelledby="partners-contact-title">
        <form className="contact-form" onSubmit={submitContactForm}>
          <button type="button" className="contact-close" aria-label="Fermer le formulaire" onClick={() => contactDialog.current?.close()}>×</button>
          <div className="contact-form-heading"><div><p className="contact-eyebrow">FORUM ENSAM-R · CONTACT</p><h2 id="partners-contact-title">Prenez part au forum.</h2><p>Parlez-nous de votre entreprise et de la manière dont vous souhaitez prendre part au forum.</p></div></div>
          <div className="contact-fields"><label>Nom complet<input name="name" required autoComplete="name" placeholder="Votre nom et prénom" /></label><label>Entreprise / organisation<input name="company" required autoComplete="organization" placeholder="Nom de votre organisation" /></label><label>Email professionnel<input type="email" name="email" required autoComplete="email" placeholder="vous@entreprise.ma" /></label><label>Votre intérêt<select name="interest" defaultValue="Partenariat"><option>Partenariat</option><option>Intervention dans un panel</option><option>Recrutement</option><option>Autre demande</option></select></label><label className="contact-message">Votre message<textarea name="message" rows={4} required placeholder="Vos idées, vos attentes, votre projet de partenariat ?" /></label></div>
          <div className="contact-form-footer"><span role="status">{contactStatus === "sending" ? "Envoi en cours…" : contactStatus === "idle" ? "Votre message sera envoyé à l’équipe du forum." : contactStatus}</span><button type="submit" className="contact-submit" disabled={contactStatus === "sending"}>Envoyer le message <span aria-hidden="true">↗</span></button></div>
        </form>
      </dialog>
    </main>
  );
}

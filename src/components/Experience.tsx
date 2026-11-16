"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";
import { experienceConfig, type SceneId } from "@/config/experience";
import { buildCues, getScrollHeightVh, resolveWords, SCROLL_CUES } from "@/experience/timeline";
import { startDirector, type DirectorHandle } from "@/experience/director";
import { CreationMedia } from "./CreationMedia";

const config = experienceConfig;
const sections = Object.values(config.sections).some(Boolean) ? config.sections : { ...config.sections, invitation: true };
const scrollWeights = { portal: 1.25, measure: 1.8, hero: 1.35, creation: 0.78, genesis: 0.78 };
const cues = buildCues(sections, scrollWeights);
const reelWords = resolveWords(config.wordReel.words, config.wordReel.finalWord);
const menuItems = [
  { label: "Accueil", target: "invitation" as const, href: undefined },
  { label: "Programme", target: null, href: "/programme" },
  { label: "Panels", target: null, href: "/panels" },
  { label: "ENSAM Rabat", target: null, href: "/ensam-rabat" },
  { label: "Partenaires", target: null, href: "/partenaires" },
  { label: "Contactez-nous", target: null, href: undefined },
];

function subscribeToPageLoad(onChange: () => void) {
  if (document.readyState === "complete") return () => {};
  window.addEventListener("load", onChange, { once: true });
  return () => window.removeEventListener("load", onChange);
}

function getPageLoaded() {
  return document.readyState === "complete";
}

function Arrow({ down = false }: { down?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={down ? { transform: "rotate(90deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function DisplayLines({ lines }: { lines: readonly string[] }) {
  return <>{lines.map((line, i) => <span className="display-line" key={`${line}-${i}`}>{line}</span>)}</>;
}

export function Experience() {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const contactDialog = useRef<HTMLDialogElement>(null);
  const director = useRef<DirectorHandle | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [renderStatus, setRenderStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [contactStatus, setContactStatus] = useState<string>("idle");
  const pageLoaded = useSyncExternalStore(subscribeToPageLoad, getPageLoaded, () => false);
  const [retry, setRetry] = useState(0);
  const [activeScene, setActiveScene] = useState<SceneId>(cues[0]?.id ?? "invitation");
  const isLoading = renderStatus === "loading" || (!pageLoaded && renderStatus !== "fallback");

  useEffect(() => {
    if (!track.current || !canvas.current) return;
    const handle = startDirector({
      root: track.current,
      canvas: canvas.current,
      cues,
      onReady: () => setRenderStatus("ready"),
      onError: () => setRenderStatus("fallback"),
      onScene: (id) => { setActiveScene(id); if (id === "duality" || id === "creation") setMediaEnabled(true); },
      onMotion: setReducedMotion,
    });
    director.current = handle;
    return () => { handle.dispose(); director.current = null; };
  }, [retry]);

  const goTo = useCallback((id: SceneId) => {
    dialog.current?.close();
    setMenuOpen(false);
    director.current?.navigate(id);
  }, []);

  const openContactForm = useCallback(() => {
    dialog.current?.close();
    setMenuOpen(false);
    setContactStatus("idle");
    contactDialog.current?.showModal();
  }, []);

  const submitContactForm = useCallback((event: FormEvent<HTMLFormElement>) => {
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
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: data,
    }).catch(() => undefined);
    window.setTimeout(() => {
      setContactStatus("Message envoyé avec succès.");
      form.reset();
    }, 2200);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (menuOpen && !element.open) element.showModal();
    else if (!menuOpen && element.open) element.close();
  }, [menuOpen]);

  const firstCue = cues[0]?.id ?? "invitation";

  return (
    <main ref={track} className={`scroll-track ${reducedMotion ? "reduced-motion" : ""}`} data-render-status={renderStatus} style={{ "--accent": config.accent, "--scroll-height": `${getScrollHeightVh(sections, scrollWeights)}vh` } as CSSProperties}>
      <a href="#experience-content" className="skip-link" onClick={(event) => { event.preventDefault(); goTo(sections.hero ? "hero" : firstCue); }}>Passer l&apos;introduction</a>
      <div className="experience-stage" inert={isLoading}>
        <div className="world-fallback" aria-hidden="true"><div className="fallback-floor" /></div>
        {sections.invitation ? <img className="invitation-tower invitation-tower-center" src="/assets/forum-tower.png" alt="" aria-hidden="true" /> : null}
        <canvas ref={canvas} className="experience-canvas" aria-hidden="true" />
        <div className="world-vignette" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />

        <header className="experience-header">
          <a href="#invitation" className="wordmark" aria-label={`${config.projectName}, return to the opening`} onClick={(event) => { event.preventDefault(); goTo(firstCue); }}>
            <svg className="brand-symbol" width="22" height="27" viewBox="0 0 22 27" fill="none" aria-hidden="true"><path d="M1 26V1h8v25M13 26V1h8v25" stroke="currentColor" strokeWidth="1.4" /><path d="M9 1v25m4-25v25" stroke="var(--accent)" strokeWidth="1.4" /></svg>
            <img className="forum-logo" src="/assets/forum-ensam-r-logo.png" alt="" width="42" height="42" />
            <span>{config.projectName}</span>
          </a>
          {config.editorial.headerNote ? <span className="header-note">{config.editorial.headerNote}</span> : null}
          <button className="index-toggle" aria-label="Ouvrir le programme" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="chapter-index" onClick={() => setMenuOpen(true)}><span className="menu-icon" aria-hidden="true"><i /><i /><i /></span></button>
        </header>

        <div id="experience-content" className="scene-layers">
          {sections.invitation ? <section className="scene-content invitation-content" data-scene="invitation" aria-labelledby="invitation-title">
            <div className="invitation-topline">{config.editorial.invitationMeta.map((line, index) => <span className={index === config.editorial.invitationMeta.length - 1 ? "invitation-date" : undefined} key={line}>{line}</span>)}</div>
            <h1 id="invitation-title" className="invitation-title display"><DisplayLines lines={config.invitation.title} /></h1>
            {config.editorial.invitationAside.length ? <p className="invitation-aside"><DisplayLines lines={config.editorial.invitationAside} /></p> : null}
            <button className="scroll-invitation" onClick={() => goTo(cues[1]?.id ?? firstCue)}><span className="scroll-line" /><span>{config.invitation.prompt}</span><Arrow down /></button>
          </section> : null}

          {sections.portal ?           <section className="scene-content portal-content" data-scene="portal" aria-label="Les portes du forum s&apos;ouvrent sur l&apos;univers ENSAM"><p className="portal-caption"><DisplayLines lines={config.editorial.portalCaption} /></p></section> : null}

          {sections.hero ? <section className="scene-content hero-content" data-scene="hero" aria-labelledby="hero-title">
            {config.hero.subtitle ? <p className="scene-kicker">{config.hero.subtitle}</p> : null}
            <h2 id="hero-title" className="hero-title display"><DisplayLines lines={config.hero.title} /></h2>
            <div className="hero-baseline"><p>{config.hero.description}</p><a href={config.hero.cta.href} className="text-link" onClick={config.hero.cta.href === "#reel" ? (event) => { event.preventDefault(); goTo(sections.reel ? "reel" : cues[Math.min(cues.findIndex((cue) => cue.id === "hero") + 1, cues.length - 1)].id); } : undefined}>{config.hero.cta.label}<Arrow /></a></div>
            {config.partners.length ? <div className="partner-placeholders">{config.partners.map((partner) => {
              const mark = partner.logo ? <picture><img src={partner.logo} alt={partner.name} width="100" height="28" loading="lazy" /></picture> : partner.name;
              return partner.href ? <a href={partner.href} key={partner.name}>{mark}</a> : <span key={partner.name}>{mark}</span>;
            })}</div> : null}
          </section> : null}

          {sections.reel ? <section className="scene-content reel-content" data-scene="reel" aria-labelledby="reel-title">
            <h2 id="reel-title" className="sr-only">{config.wordReel.prefix} {config.wordReel.finalWord}.</h2>
            <div className="reel-composition" aria-hidden="true"><div className="reel-prefix">{config.wordReel.prefix}</div><div className="word-window"><div className="word-strip">{reelWords.map((word, index) => <div className={`reel-word ${word === config.wordReel.finalWord ? "winning-word" : ""}`} key={`${word}-${index}`}><span>{word}</span>{word === config.wordReel.finalWord ? <span className="reel-period">.</span> : null}</div>)}</div></div></div>
            <div className="reel-footnote"><span>{config.editorial.reelFootnote}</span><span className="word-counter">01 / {String(reelWords.length).padStart(2, "0")}</span></div>
          </section> : null}

          {sections.duality ? <section className="scene-content duality-content" data-scene="duality" aria-labelledby="duality-title"><h2 id="duality-title" className="duality-title display"><span className="duality-first">{config.duality.first}</span><span className="duality-second">{config.duality.second}</span></h2></section> : null}

          {sections.creation ? <section className="scene-content creation-content" data-scene="creation" aria-labelledby="creation-title">
            <CreationMedia enabled={mediaEnabled} reducedMotion={reducedMotion} />
            <div className="creation-heading">{config.creation.subtitle ? <p className="scene-kicker">{config.creation.subtitle}</p> : null}<h2 id="creation-title" className="creation-title display">{config.creation.title}</h2></div>
          </section> : null}

          {sections.measure ? <section className="scene-content measure-content" data-scene="measure" aria-labelledby="measure-title">
            <h2 id="measure-title" className="measure-heading display">{config.measure.title}</h2>
            <div className="measure-frame" aria-hidden="true">
              <span className="measure-rule measure-rule-top" />
              <span className="measure-rule measure-rule-bottom" />
              {config.measure.subtitle ? <p className="measure-kicker">{config.measure.subtitle}</p> : null}
              <div className="measure-copy">
                <p className="measure-title"><span className="measure-label">Visiteurs</span></p>
              </div>
              <div className="measure-reading">
                <span className="measure-number">2000</span>
              </div>
              <div className="measure-index"><span className="measure-index-current">01</span><span aria-hidden="true"> / 04</span></div>
              <span className="measure-mark measure-mark-left" />
              <span className="measure-mark measure-mark-right" />
            </div>
          </section> : null}

          {sections.genesis ? <section className="scene-content genesis-content" data-scene="genesis" aria-labelledby="genesis-title"><h2 id="genesis-title" className="genesis-title display"><DisplayLines lines={config.genesis.title} /></h2>{config.editorial.genesisNote ? <span className="genesis-note">{config.editorial.genesisNote}</span> : null}<button type="button" className="genesis-cta" onClick={(event) => { event.preventDefault(); openContactForm(); }}>{config.genesis.cta.label}<Arrow /></button></section> : null}

          {sections.outro ? <section className="scene-content outro-content" data-scene="outro" aria-labelledby="outro-title"><h2 id="outro-title" className="outro-title display"><DisplayLines lines={config.outro.title} /></h2><div className="outro-baseline"><p>{config.outro.description}</p></div><button type="button" className="genesis-cta outro-cta" onClick={(event) => { event.preventDefault(); openContactForm(); }}>{config.outro.cta.label}<Arrow /></button><div className="outro-footer"><div className="outro-contacts"><a href={`mailto:${config.footer.contacts.email}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5.5h18v13H3zM3.5 6l8.5 7 8.5-7" /></svg><span>{config.footer.contacts.email}</span></a><a href={`tel:${config.footer.contacts.phone.replace(/[^\d+]/g, "")}`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.5 10 6.3 8.2 9a14.5 14.5 0 0 0 6.8 6.8l2.7 1.8 2.8-2.8-1.7-2.8c-.4-.7-1.2-1-2-.8C9.9 18.5 5.5 14.1 3.6 7.2c-.2-.8.1-1.6.8-2z" /></svg><span>{config.footer.contacts.phone}</span></a><a href="https://www.instagram.com/forum_ensamr_entreprise" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.5" cy="6.8" r=".7" /></svg><span>{config.footer.contacts.instagram}</span></a><span className="outro-location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.2" /></svg><span>{config.footer.contacts.location}</span></span></div><button className="outro-return" onClick={() => goTo(firstCue)}>Retour au début <Arrow /></button></div></section> : null}
        </div>

        <div className="film-hud" aria-hidden="true"><span className="chapter-label">00 L&apos;ouverture</span><div className="progress-display"><span className="progress-count">00</span><div className="progress-rail"><span /></div><span>{String(SCROLL_CUES.length - 1).padStart(2, "0")}</span></div></div>
        {renderStatus === "fallback" ? <div className="render-notice"><span>Version fixe.</span><button onClick={() => { setRenderStatus("loading"); setRetry((value) => value + 1); }}>Relancer la 3D</button></div> : null}
      </div>

      {isLoading ? <div className="loading-overlay" role="status" aria-label="Préparation de l&apos;expérience">
        <svg className="loading-filter" aria-hidden="true" focusable="false">
          <defs>
            <filter id="threshold-loading-goo" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.25" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
        <span className="loading-orbs" aria-hidden="true">
          <span className="loading-orb" />
          <span className="loading-orb" />
          <span className="loading-orb" />
        </span>
      </div> : null}

      {cues.map((cue) => <span id={cue.id} className="chapter-anchor" key={cue.id} data-cue-start={cue.start} style={{ top: `calc((var(--scroll-height) - 100svh) * ${cue.start})` }} aria-hidden="true" />)}

      <dialog id="chapter-index" ref={dialog} className="chapter-dialog" inert={isLoading} onCancel={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }} aria-labelledby="index-title">
        <div className="index-panel"><div className="index-heading"><h2 id="index-title">FORUM ENSAM-R</h2><button aria-label="Fermer le programme" onClick={() => setMenuOpen(false)}>Fermer <span aria-hidden="true">×</span></button></div>
          <nav aria-label="Navigation principale">{menuItems.map((item, index) => <button key={item.label} onClick={() => item.href ? window.location.assign(item.href) : item.target ? goTo(item.target) : openContactForm()} aria-current={item.target && activeScene === item.target ? "location" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span><Arrow /></button>)}</nav>
          <div className="index-settings"><button aria-pressed={reducedMotion} onClick={() => director.current?.setReducedMotion(!reducedMotion)}><span className={`motion-switch ${reducedMotion ? "is-on" : ""}`} />Réduire les mouvements<span>{reducedMotion ? "Oui" : "Non"}</span></button><p>Développé par <a href="https://github.com/Xornyv3" target="_blank" rel="noreferrer">xornyv3</a></p></div>
        </div>
      </dialog>
      <dialog ref={contactDialog} className="contact-dialog" onClick={(event) => { if (event.target === event.currentTarget) contactDialog.current?.close(); }} aria-labelledby="contact-title">
        <form className="contact-form" onSubmit={submitContactForm}>
          <button type="button" className="contact-close" aria-label="Fermer le formulaire" onClick={() => contactDialog.current?.close()}>×</button>
          <div className="contact-form-heading"><div><p className="contact-eyebrow">FORUM ENSAM-R · CONTACT</p><h2 id="contact-title">Prenez part au forum.</h2><p>Parlez-nous de votre entreprise et de la manière dont vous souhaitez prendre part au forum.</p></div></div>
          <div className="contact-fields"><label>Nom complet<input name="name" required autoComplete="name" placeholder="Votre nom et prénom" /></label><label>Entreprise / organisation<input name="company" required autoComplete="organization" placeholder="Nom de votre organisation" /></label><label>Email professionnel<input type="email" name="email" required autoComplete="email" placeholder="vous@entreprise.ma" /></label><label>Votre intérêt<select name="interest" defaultValue="Partenariat"><option>Partenariat</option><option>Intervention dans un panel</option><option>Recrutement</option><option>Autre demande</option></select></label><label className="contact-message">Votre message<textarea name="message" rows={4} required placeholder="Vos idées, vos attentes, votre projet de partenariat ?" /></label></div>
          <div className="contact-form-footer"><span role="status">{contactStatus === "sending" ? "Envoi en cours…" : contactStatus === "idle" ? "Votre message sera envoyé à l’équipe du forum." : contactStatus}</span><button type="submit" className="contact-submit" disabled={contactStatus === "sending"}>Envoyer le message <Arrow /></button></div>
        </form>
      </dialog>
      <noscript><style>{`.scroll-track{height:auto!important}.experience-stage{height:auto;position:relative;overflow:visible}.scene-layers{position:relative}.scene-content{position:relative!important;opacity:1!important;visibility:visible!important;min-height:100svh;transform:none!important;pointer-events:auto!important;padding:100px 7vw}.experience-canvas,.world-fallback,.film-hud,.index-toggle,.loading-overlay,.chapter-anchor{display:none}.experience-header{position:relative}.scene-content h2,.scene-content h1{font-size:12vw}.word-strip{transform:none!important}.word-window{height:auto;overflow:visible}.reel-word{height:auto}.creation-media{position:relative;height:40vh}.creation-heading,.creation-note{position:relative}.hero-baseline,.outro-baseline,.outro-footer{position:relative;inset:auto;margin-top:32px}.wordmark{position:relative}`}</style>      <p className="noscript-note">Vous consultez la version fixe. Activez JavaScript pour l&apos;expérience interactive.</p></noscript>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const menuItems = [
  ["Accueil", "/"],
  ["Programme", "/programme"],
  ["Panels", "/panels"],
  ["ENSAM Rabat", "/ensam-rabat"],
  ["Partenaires", "/partenaires"],
  ["Contactez-nous", "/#contact"],
] as const;

export function EditorialMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <>
      <button
        className="index-toggle editorial-menu-toggle"
        type="button"
        aria-label="Ouvrir le menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="editorial-menu"
        onClick={() => setOpen(true)}
      >
        <span className="menu-icon" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <dialog
        id="editorial-menu"
        ref={dialog}
        className="chapter-dialog"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-labelledby="editorial-menu-title"
      >
        <div className="index-panel">
          <div className="index-heading">
            <h2 id="editorial-menu-title">FORUM ENSAM-R</h2>
            <button type="button" onClick={() => setOpen(false)}>Fermer <span aria-hidden="true">×</span></button>
          </div>
          <nav aria-label="Navigation principale">
            {menuItems.map(([label, href], index) => (
              <Link key={label} href={href} onClick={() => setOpen(false)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{label}</span>
                <span className="editorial-menu-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
          <div className="index-settings">
            <p>Développé par <a href="https://github.com/Xornyv3" target="_blank" rel="noreferrer">xornyv3</a></p>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** All public-facing content and replaceable production assets live here. */
export type SceneId =
  | "invitation"
  | "portal"
  | "hero"
  | "reel"
  | "duality"
  | "creation"
  | "measure"
  | "genesis"
  | "outro";

export interface ExperienceConfig {
  projectName: string;
  accent: string;
  editorial: {
    headerNote: string;
    invitationMeta: string[];
    invitationAside: string[];
    portalCaption: string[];
    reelFootnote: string;
    materialLabels: string[];
    creationNote: string[];
    genesisNote: string;
  };
  invitation: { title: string[]; prompt: string };
  hero: {
    title: string[];
    subtitle: string;
    description: string;
    cta: { label: string; href: string };
  };
  wordReel: {
    prefix: string;
    words: string[];
    finalWord: string;
    neutralColor: string;
    finalColor: string;
  };
  duality: { first: string; second: string };
  creation: { title: string; subtitle: string };
  measure: { title: string; subtitle: string };
  genesis: { title: string[]; cta: { label: string; href: string } };
  outro: {
    title: string[];
    description: string;
    cta: { label: string; href: string };
  };
  partners: { name: string; logo?: string; href?: string }[];
  sections: Record<SceneId, boolean>;
  assets: {
    handsVideoDesktop: string | null;
    handsVideoMobile: string | null;
    handsGlb: string | null;
  };
  footer: {
    credit: string;
    note: string;
    contacts: { email: string; phone: string; instagram: string; location: string };
  };
}

export const experienceConfig: ExperienceConfig = {
  projectName: "FORUM ENSAM-R",
  accent: "#00C8E8",
  editorial: {
    headerNote: "",
    invitationMeta: ["FORUM INDUSTRIEL ENSAM RABAT", "2–3 DÉCEMBRE 2026"],
    invitationAside: [],
    portalCaption: ["Tout commence", "à l'ENSAM Rabat."],
    reelFootnote: "Cinq qualités pour penser l'ingénieur de demain.",
    materialLabels: ["01 / Académie", "02 / Industrie"],
    creationNote: [],
    genesisNote: "Rencontrez les futurs ingénieurs de l'ENSAM Rabat.",
  },
  invitation: {
    title: ["PENSER", "L'INDUSTRIE."],
    prompt: "ENTRER DANS LE FORUM",
  },
  hero: {
    title: ["FORUM", "INDUSTRIEL"],
    subtitle: "",
    description: "Deux journées de rencontres entre étudiants, ingénieurs et entreprises.",
    cta: { label: "Devenir partenaire", href: "mailto:contact@forumensamrabat.com" },
  },
  wordReel: {
    prefix: "L'INGÉNIEUR EST",
    words: ["MÉTHODIQUE", "ANALYTIQUE", "RIGOUREUX", "INVENTIF", "AUGMENTÉ"],
    finalWord: "AUGMENTÉ",
    neutralColor: "#F6F8FC",
    finalColor: "#00C8E8",
  },
  duality: {
    first: "L'ACADÉMIE FORME.",
    second: "L'INDUSTRIE MET EN PRATIQUE.",
  },
  creation: {
    title: "L'ingénieur à l'ère de l'IA.",
    subtitle: "Trois panels pour discuter des usages, des compétences et des responsabilités liés à l'IA.",
  },
  measure: {
    title: "1ère Edition en Chiffres",
    subtitle: "",
  },
  genesis: {
    title: ["PRENEZ PART", "AU FORUM."],
    cta: { label: "Devenir partenaire", href: "mailto:contact@forumensamrabat.com" },
  },
  outro: {
    title: ["RENDEZ-VOUS", "LES 2 & 3", "DÉCEMBRE."],
    description: "Deux journées d’échanges entre étudiants, ingénieurs et entreprises.",
    cta: { label: "Devenir partenaire", href: "mailto:contact@forumensamrabat.com" },
  },
  // Add only approved partner marks. Empty by design; no endorsements are implied.
  partners: [],
  sections: {
    invitation: true,
    portal: true,
    hero: true,
    reel: true,
    duality: true,
    creation: true,
    measure: true,
    genesis: true,
    outro: true,
  },
  assets: {
    handsVideoDesktop: "/assets/humanxmachine-scrub-desktop.mp4",
    handsVideoMobile: "/assets/humanxmachine-scrub-mobile.mp4",
    handsGlb: null,
  },
  footer: {
    credit: "FORUM ENSAM-R • 2–3 DÉCEMBRE 2026",
    note: "contact@forumensamrabat.com • +212 537 687 150 • Instagram @forum_ensamr_entreprise",
    contacts: {
      email: "contact@forumensamrabat.com",
      phone: "(+212) 537 687 150",
      instagram: "@forum_ensamr_entreprise",
      location: "ENSAM Rabat, Maroc",
    },
  },
};

export const assetManifest = [
  {
    id: "creation-film",
    path: experienceConfig.assets.handsVideoDesktop,
    status: "scroll-scrubbed",
    description: "Two-second, 24 fps human and robotic hand film, scrubbed reversibly from creation-scene scroll progress.",
  },
  {
    id: "creation-rig",
    path: experienceConfig.assets.handsGlb,
    status: "not-produced",
    description: "Optional optimized rigged GLB alternative. A production integration task, not a shipped model.",
  },
] as const;

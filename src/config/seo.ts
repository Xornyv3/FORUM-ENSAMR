import type { Metadata } from "next";

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Forum ENSAM Rabat",
      title,
      description,
      url: path,
      images: [{ url: "/assets/forum-ensam-r-logo.png", alt: "Forum ENSAM Rabat" }],
    },
    twitter: { card: "summary", title, description, images: ["/assets/forum-ensam-r-logo.png"] },
  };
}

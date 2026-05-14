import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

type BuildPageMetadataArgs = {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  /** Vollständige absolute URL zu einem OG-Bild (z. B. `${siteConfig.url}/og.png`) */
  ogImageAbsoluteUrl?: string;
};

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  ogImageAbsoluteUrl,
}: BuildPageMetadataArgs): Metadata {
  const path = pathname === "/" ? "" : pathname;
  const canonical = `${siteConfig.url}/${locale}${path}`;
  const openGraph: Metadata["openGraph"] = {
    title,
    description,
    url: canonical,
    siteName: siteConfig.name,
    locale: locale === "de" ? "de_DE" : "en_US",
    type: "website",
  };

  if (ogImageAbsoluteUrl) {
    openGraph.images = [
      {
        url: ogImageAbsoluteUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
  }

  return {
    title,
    description,
    openGraph,
    alternates: {
      canonical,
      languages: {
        de: `${siteConfig.url}/de${path}`,
        en: `${siteConfig.url}/en${path}`,
      },
    },
  };
}

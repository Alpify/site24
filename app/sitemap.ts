import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

const LOCALIZED_PATHS = [
  "",
  "/produkt",
  "/ablauf",
  "/hosting",
  "/preise",
  "/login",
  "/impressum",
  "/datenschutz",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of LOCALIZED_PATHS) {
      const url = `${base}/${locale}${path}`;
      entries.push({
        url,
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.65,
      });
    }
  }

  return entries;
}

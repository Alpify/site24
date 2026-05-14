import { siteConfig } from "@/lib/site-config";

type JsonLdSiteProps = {
  locale: string;
  description: string;
};

export function JsonLdSite({ locale, description }: JsonLdSiteProps) {
  const base = siteConfig.url.replace(/\/$/, "");
  const orgId = `${base}#organization`;
  const siteId = `${base}#website`;

  const graph = [
    {
      "@type": "Organization",
      "@id": orgId,
      name: siteConfig.name,
      url: base,
      email: siteConfig.contactEmail,
    },
    {
      "@type": "WebSite",
      "@id": siteId,
      name: siteConfig.name,
      url: `${base}/${locale}`,
      description,
      inLanguage: locale === "de" ? "de-DE" : "en-US",
      publisher: { "@id": orgId },
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

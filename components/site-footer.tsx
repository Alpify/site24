import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] py-12 sm:px-6 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-lg font-semibold text-foreground">
              site24<span className="text-accent">.com</span>
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              {t("tagline")}
            </p>
            <p className="mt-4 max-w-lg text-xs leading-relaxed text-muted">
              {t("dataNote")}
            </p>
          </div>
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-foreground">
              {t("contactTitle")}
            </p>
            <p className="mt-2 text-sm text-muted">{t("contactLead")}</p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-3 inline-block min-h-11 text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              {siteConfig.contactEmail}
            </a>
          </div>
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-foreground">{t("legal")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link
                  href="/impressum"
                  className="inline-flex min-h-10 items-center hover:text-accent"
                >
                  {t("links.imprint")}
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="inline-flex min-h-10 items-center hover:text-accent"
                >
                  {t("links.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-8 text-center text-xs text-muted">
          © {year} {siteConfig.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

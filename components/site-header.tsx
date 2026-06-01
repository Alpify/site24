"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { NavCreateMenu } from "@/components/nav-create-menu";
import {
  UserAccountPanel,
  type AccountPanelUser,
} from "@/components/user-account-panel";

function normalizeAppPathname(pathname: string | null | undefined): string | null {
  if (pathname == null) return null;
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function isAppRoute(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

const secondaryRoutes = [
  { href: "/hosting", key: "hosting" as const },
  { href: "/preise", key: "pricing" as const },
];

export function SiteHeader({
  user,
  signOutAction,
  switchAccountAction,
}: {
  user: AccountPanelUser | null;
  signOutAction?: () => Promise<void>;
  switchAccountAction?: () => Promise<void>;
}) {
  const t = useTranslations("nav");
  const pathnameRaw = usePathname();
  const pathname = normalizeAppPathname(pathnameRaw);
  const pathKey = pathname ?? "";
  const homeActive = pathKey === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-2 px-[max(1rem,env(safe-area-inset-left))] sm:h-16 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="flex min-w-0 shrink items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center text-base font-semibold tracking-tight text-foreground sm:text-lg"
          >
            site24<span className="text-accent">.com</span>
          </Link>
          <span
            className="hidden h-6 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
          <Link
            href="/"
            aria-current={homeActive ? "page" : undefined}
            className={`hidden min-h-11 shrink-0 items-center rounded-lg px-2.5 text-sm font-medium transition-colors sm:inline-flex lg:px-3 ${
              homeActive
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            {t("home")}
          </Link>
        </div>
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1"
          aria-label={t("ariaMain")}
        >
          <NavCreateMenu />
          {secondaryRoutes.map(({ href, key }) => {
            const active = pathKey === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitcher />
          {user && signOutAction ? (
            <UserAccountPanel
              user={user}
              signOutAction={signOutAction}
              switchAccountAction={switchAccountAction}
              variant="menu"
            />
          ) : (
            <Link
              href="/login"
              aria-label={t("loginAria")}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pathKey === "/login" ? "bg-accent/10 text-accent" : ""
              }`}
            >
              <UserIcon className="h-5 w-5" />
            </Link>
          )}
          {user ? (
            <Link
              href="/app"
              aria-current={isAppRoute(pathKey) ? "page" : undefined}
              className="rounded-lg bg-accent px-2.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-hover sm:px-4 sm:text-sm"
            >
              {pathKey === "/" ? t("ctaLoggedHome") : t("myProjects")}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-current={pathKey === "/login" ? "page" : undefined}
              className="rounded-lg bg-accent px-2.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-accent-hover sm:px-4 sm:text-sm"
            >
              {pathKey === "/" ? t("ctaGuestHome") : t("cta")}
            </Link>
          )}
        </div>
      </div>
      <nav
        className="border-t border-border/60 px-[max(0.75rem,env(safe-area-inset-left))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
        aria-label={t("ariaMainMobile")}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 pr-[max(0.75rem,env(safe-area-inset-right))]">
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted">
            {t("createGroup")}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <MobilePill href="/" active={homeActive}>
              {t("home")}
            </MobilePill>
            <MobilePill href="/ablauf" active={pathKey === "/ablauf"}>
              {t("workflowItem")}
            </MobilePill>
            <MobilePill href="/produkt" active={pathKey === "/produkt"}>
              {t("productItem")}
            </MobilePill>
            {secondaryRoutes.map(({ href, key }) => (
              <MobilePill key={href} href={href} active={pathKey === href}>
                {t(key)}
              </MobilePill>
            ))}
            {user ? (
              <MobilePill href="/app" active={isAppRoute(pathKey)}>
                {t("myProjects")}
              </MobilePill>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}

function MobilePill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-medium leading-tight ${
        active ? "bg-accent/15 text-accent" : "bg-background text-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function LocaleSwitcher() {
  const pathname = usePathname();
  const locale = useLocale();
  const href = pathname ?? "/";
  const tab =
    "rounded-md px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div
      className="flex rounded-lg border border-border bg-background p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      <Link
        href={href}
        locale="de"
        className={`${tab} ${locale === "de" ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
      >
        DE
      </Link>
      <Link
        href={href}
        locale="en"
        className={`${tab} ${locale === "en" ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
      >
        EN
      </Link>
    </div>
  );
}

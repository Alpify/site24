"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Link } from "@/i18n/routing";

export type AccountPanelUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type UserAccountPanelProps = {
  user: AccountPanelUser;
  signOutAction: () => Promise<void>;
  switchAccountAction?: () => Promise<void>;
  /** Compact avatar trigger for the header; omit for inline panel (e.g. login page). */
  variant?: "menu" | "inline";
};

export function UserAccountPanel({
  user,
  signOutAction,
  switchAccountAction,
  variant = "menu",
}: UserAccountPanelProps) {
  const t = useTranslations("account");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const signOutFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setConfirmOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  function openSignOutConfirm() {
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  function confirmSignOut() {
    startTransition(() => {
      signOutFormRef.current?.requestSubmit();
    });
  }

  const panel = (
    <div
      className={
        variant === "menu"
          ? "w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-card shadow-lg"
          : "w-full max-w-sm rounded-xl border border-border bg-card shadow-sm"
      }
      role="region"
      aria-label={t("panelAria")}
    >
      <div className="flex gap-3 border-b border-border px-4 py-4">
        <AccountAvatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name?.trim() || t("fallbackName")}
          </p>
          <p className="truncate text-xs text-muted">
            {user.email ?? "—"}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
            <GoogleMark className="h-3.5 w-3.5 shrink-0" />
            {t("googleAccount")}
          </p>
        </div>
      </div>

      <div className="p-2">
        <Link
          href="/app"
          onClick={() => setMenuOpen(false)}
          className="flex min-h-10 items-center rounded-lg px-3 text-sm text-foreground hover:bg-background"
        >
          {t("myProjects")}
        </Link>
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="flex min-h-10 items-center rounded-lg px-3 text-sm text-muted hover:bg-background hover:text-foreground"
        >
          {t("accountSettings")}
        </Link>
      </div>

      <div className="border-t border-border p-2">
        {switchAccountAction ? (
          <form
            action={switchAccountAction}
            onSubmit={() => setMenuOpen(false)}
          >
            <button
              type="submit"
              disabled={pending}
              className="flex w-full min-h-10 items-center gap-2 rounded-lg px-3 text-left text-sm text-foreground hover:bg-background disabled:opacity-60"
            >
              <GoogleMark className="h-4 w-4 shrink-0" />
              {t("switchAccount")}
            </button>
          </form>
        ) : null}
        <button
          type="button"
          onClick={openSignOutConfirm}
          disabled={pending}
          className="mt-0.5 flex w-full min-h-10 items-center rounded-lg px-3 text-left text-sm text-muted hover:bg-background hover:text-foreground disabled:opacity-60"
        >
          {t("signOut")}
        </button>
      </div>

      <form ref={signOutFormRef} action={signOutAction} className="hidden" />
    </div>
  );

  return (
    <>
      {variant === "menu" ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[open=true]:bg-accent/10 data-[open=true]:text-accent"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label={t("menuTriggerAria")}
            data-open={menuOpen}
          >
            <AccountAvatar user={user} size="md" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-50 mt-2">{panel}</div>
          ) : null}
        </div>
      ) : (
        panel
      )}

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-out-title"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <AccountAvatar user={user} size="lg" />
              <div className="min-w-0">
                <h2
                  id="sign-out-title"
                  className="text-base font-semibold text-foreground"
                >
                  {t("confirmTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted">{t("confirmBody")}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className="min-h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-background disabled:opacity-60"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmSignOut}
                disabled={pending}
                className="min-h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {pending ? t("signingOut") : t("confirmSignOut")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AccountAvatar({
  user,
  size,
}: {
  user: AccountPanelUser;
  size: "md" | "lg";
}) {
  const dim = size === "lg" ? 40 : 32;
  const initial = (
    user.name?.trim()?.[0] ??
    user.email?.trim()?.[0] ??
    "?"
  ).toUpperCase();

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={dim}
        height={dim}
        className="rounded-full object-cover"
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent"
      style={{ width: dim, height: dim, fontSize: size === "lg" ? 14 : 12 }}
    >
      {initial}
    </span>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

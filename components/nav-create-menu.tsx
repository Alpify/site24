"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function NavCreateMenu({ className = "" }: { className?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();

  const inside = pathname === "/ablauf" || pathname === "/produkt";

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocMouseDown);
    }
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          inside && !open
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-card hover:text-foreground"
        } ${open ? "bg-card text-foreground shadow-sm ring-1 ring-border" : ""}`}
      >
        {t("createGroup")}
        <span className="text-[10px] opacity-60" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-labelledby={btnId}
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[min(100vw-2rem,240px)] rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            href="/ablauf"
            className="block px-4 py-3 text-left text-sm transition-colors hover:bg-background"
            onClick={() => setOpen(false)}
          >
            <span className="font-medium text-foreground">{t("workflowItem")}</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted">
              {t("workflowDesc")}
            </span>
          </Link>
          <Link
            role="menuitem"
            href="/produkt"
            className="block px-4 py-3 text-left text-sm transition-colors hover:bg-background"
            onClick={() => setOpen(false)}
          >
            <span className="font-medium text-foreground">{t("productItem")}</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted">
              {t("productDesc")}
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { Link } from "@/i18n/routing";
import { buttonClassName } from "@/components/ui/button";

export type HeroStepCopy = {
  id: string;
  title: string;
  teaser: string;
  items: [string, string, string];
};

export function HomeHero({
  isLoggedIn,
  copy,
}: {
  isLoggedIn: boolean;
  copy: {
    eyebrow: string;
    title: string;
    subtitle: string;
    hint: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stepsLabel: string;
    steps: HeroStepCopy[];
  };
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const listId = useId();
  const active = copy.steps.find((s) => s.id === activeId) ?? null;

  return (
    <section className="hero-surface border-b border-border">
      <div className="relative mx-auto max-w-6xl px-[max(1rem,env(safe-area-inset-left))] py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24 lg:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:text-sm">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-[1.12] tracking-tight text-foreground">
              {copy.title}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{copy.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted/90">{copy.hint}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={isLoggedIn ? "/app" : "/login"}
                className={buttonClassName(
                  "primary",
                  "inline-flex min-h-12 w-full justify-center px-8 py-3.5 text-base shadow-md sm:w-auto sm:min-w-[11rem]",
                )}
              >
                {copy.ctaPrimary}
              </Link>
              <Link
                href="/ablauf"
                className={buttonClassName(
                  "secondary",
                  "inline-flex min-h-12 w-full justify-center px-8 py-3.5 text-base sm:w-auto",
                )}
              >
                {copy.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <p
              id={listId}
              className="text-xs font-semibold uppercase tracking-wide text-muted"
            >
              {copy.stepsLabel}
            </p>
            <ol
              className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
              aria-labelledby={listId}
              onMouseLeave={() => setActiveId(null)}
            >
              {copy.steps.map((step, idx) => {
                const isActive = activeId === step.id;
                return (
                  <li key={step.id} className="relative">
                    <button
                      type="button"
                      className={`group flex w-full flex-col rounded-xl border px-4 py-3.5 text-left transition-all ${
                        isActive
                          ? "border-accent bg-accent/10 shadow-md ring-2 ring-accent/20"
                          : "border-border/80 bg-card/80 hover:border-accent/35 hover:bg-background"
                      }`}
                      aria-expanded={isActive}
                      onMouseEnter={() => setActiveId(step.id)}
                      onFocus={() => setActiveId(step.id)}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setActiveId((cur) => (cur === step.id ? null : cur));
                        }
                      }}
                      onClick={() => setActiveId((cur) => (cur === step.id ? null : step.id))}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isActive ? "bg-accent text-white" : "bg-muted/25 text-muted group-hover:text-foreground"
                          }`}
                          aria-hidden
                        >
                          {idx + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">{step.title}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted">{step.teaser}</span>
                        </span>
                      </span>
                    </button>
                    {isActive ? (
                      <div
                        className="mt-2 overflow-hidden rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur-sm sm:absolute sm:left-0 sm:right-0 sm:z-20 sm:mt-1 lg:static lg:mt-2"
                        role="region"
                        aria-label={step.title}
                      >
                        <ul className="space-y-2 border-l-2 border-accent/40 pl-3">
                          {step.items.map((item) => (
                            <li key={item} className="text-sm leading-snug text-muted">
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 border-t border-border/60 pt-2 text-xs text-muted">
                          <Link
                            href="/ablauf"
                            className="font-medium text-accent underline-offset-4 hover:underline"
                          >
                            {copy.ctaSecondary}
                          </Link>
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

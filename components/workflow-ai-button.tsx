"use client";

import { useState } from "react";

import { buttonClassName } from "@/components/ui/button";

type AiErrorCode = "config" | "api" | "state" | "forbidden";

export function WorkflowAiButton({
  locale,
  projectId,
  endpoint,
  label,
  pendingLabel,
  successRedirect,
  onSuccess,
  variant = "secondary",
  className,
  confirmMessage,
}: {
  locale: string;
  projectId: string;
  endpoint: string;
  label: string;
  pendingLabel: string;
  successRedirect?: string;
  onSuccess?: (body: Record<string, unknown>) => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  confirmMessage?: string;
}) {
  const [pending, setPending] = useState(false);

  async function run() {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }
    setPending(true);
    try {
      const url = `${endpoint}?locale=${encodeURIComponent(locale)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* ignore */
      }

      if (res.status === 401) {
        window.location.assign(`/${locale}/login`);
        return;
      }

      if (!res.ok) {
        const err = String(body.error ?? "api") as AiErrorCode;
        const q =
          err === "config" || err === "api" || err === "state" ? err : "api";
        const step = successRedirect?.includes("/brief")
          ? "brief"
          : successRedirect?.includes("/layout")
            ? "layout"
            : "polish";
        window.location.assign(
          `/${locale}/app/${projectId}/${step}?aiError=${encodeURIComponent(q)}`,
        );
        return;
      }

      if (onSuccess) {
        onSuccess(body);
        return;
      }

      if (successRedirect) {
        window.location.assign(successRedirect);
      } else {
        window.location.reload();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void run()}
      className={
        className ??
        buttonClassName(variant, "min-h-10 gap-2 px-4 text-sm shadow-sm")
      }
    >
      <SparkleIcon className={pending ? "animate-pulse" : ""} />
      {pending ? pendingLabel : label}
    </button>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l1.2 4.2L17.5 8 13.2 9.2 12 13.5 10.8 9.2 6.5 8l4.3-1.8L12 2zm7 9l.9 3.1L23 15l-3.1.9L19 19l-.9-3.1L15 15l3.1-.9L19 11zm-14 1l.7 2.4L8 15l-2.3.6L5 18l-.7-2.4L2 15l2.3-.6L5 12z" />
    </svg>
  );
}

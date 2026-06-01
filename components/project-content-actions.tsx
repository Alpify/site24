"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";

import { applySiteTemplate } from "@/lib/templates/actions";
import { buttonClassName } from "@/components/ui/button";

function PendingSubmitButton({
  idle,
  pending,
  className,
}: {
  idle: string;
  pending: string;
  className: string;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button type="submit" disabled={isPending} className={className}>
      {isPending ? pending : idle}
    </button>
  );
}

/** Form + server action: redirect after apply works reliably (not useTransition + redirect). */
export function ApplyTemplateButton({
  locale,
  projectId,
  templateId,
  label,
  pendingLabel,
  className,
}: {
  locale: string;
  projectId: string;
  templateId: string;
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const action = applySiteTemplate.bind(null, locale, projectId, templateId);
  return (
    <form action={action} method="post" className="inline">
      <PendingSubmitButton
        idle={label}
        pending={pendingLabel}
        className={className ?? buttonClassName("secondary", "min-h-10 shrink-0 px-4 text-sm")}
      />
    </form>
  );
}

/** KI-Expand: POST API, dann voller Seiten-Reload (verlässiger als router.refresh). */
export function ExpandDraftAiButton({
  locale,
  projectId,
  draftId,
  label,
  pendingLabel,
  className,
}: {
  locale: string;
  projectId: string;
  draftId: string;
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const url = `/api/projects/${encodeURIComponent(projectId)}/drafts/${encodeURIComponent(draftId)}/expand?locale=${encodeURIComponent(locale)}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        /* ignore */
      }

      if (res.status === 401) {
        window.location.assign(`/${locale}/login`);
        return;
      }

      if (!res.ok) {
        const code =
          body.error === "config" || body.error === "api" || body.error === "notfound" || body.error === "forbidden"
            ? body.error
            : "api";
        const q = code === "notfound" || code === "forbidden" ? "state" : code;
        window.location.assign(`/${locale}/app/${projectId}/polish?aiError=${encodeURIComponent(q)}`);
        return;
      }

      window.location.assign(`/${locale}/app/${projectId}/polish`);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void run()}
      className={className ?? buttonClassName("secondary", "min-h-9 shrink-0 px-3 py-2 text-xs sm:min-h-10 sm:px-4 sm:text-sm")}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

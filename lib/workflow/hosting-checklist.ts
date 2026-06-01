export const HOSTING_CHECK_IDS = [
  "content_reviewed",
  "preview_checked",
  "domain_planned",
  "partner_ready",
] as const;

export type HostingCheckId = (typeof HOSTING_CHECK_IDS)[number];

export type HostingPayloadV1 = {
  version: 1;
  checked: HostingCheckId[];
};

export function parseHostingPayload(raw: string | null | undefined): HostingPayloadV1 {
  if (!raw?.trim()) {
    return { version: 1, checked: [] };
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") {
      return { version: 1, checked: [] };
    }
    const o = data as Record<string, unknown>;
    if (o.version !== 1 || !Array.isArray(o.checked)) {
      return { version: 1, checked: [] };
    }
    const checked = o.checked.filter(
      (id): id is HostingCheckId =>
        typeof id === "string" && (HOSTING_CHECK_IDS as readonly string[]).includes(id),
    );
    return { version: 1, checked: [...new Set(checked)] };
  } catch {
    return { version: 1, checked: [] };
  }
}

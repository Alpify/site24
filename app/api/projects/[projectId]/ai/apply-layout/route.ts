import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { aiApplyLayoutForUser } from "@/lib/projects/ai-workflow";
import { isLayoutProposalId } from "@/lib/workflow/layout-proposals";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "de";
  const body = (await request.json().catch(() => ({}))) as { proposalId?: string };
  if (!body.proposalId || !isLayoutProposalId(body.proposalId)) {
    return NextResponse.json({ error: "state" }, { status: 400 });
  }

  const t = await getTranslations({ locale, namespace: "workflow" });
  const labelFn = (key: string) => t(key as "brief.questions.site_topic");

  const result = await aiApplyLayoutForUser({
    userId: session.user.id,
    locale,
    projectId,
    proposalId: body.proposalId,
    labelFn,
  });

  if (!result.ok) {
    const status = result.error === "forbidden" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath(`/${locale}/app/${projectId}`, "layout");
  return NextResponse.json({ ok: true, proposalId: result.data.proposalId });
}

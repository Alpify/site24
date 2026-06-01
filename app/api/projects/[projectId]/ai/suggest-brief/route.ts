import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { aiSuggestBriefForUser } from "@/lib/projects/ai-workflow";

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
  const t = await getTranslations({ locale, namespace: "workflow" });
  const labelFn = (key: string) => t(key as "brief.questions.site_topic");

  const result = await aiSuggestBriefForUser({
    userId: session.user.id,
    locale,
    projectId,
    labelFn,
  });

  if (!result.ok) {
    const status = result.error === "forbidden" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath(`/${locale}/app/${projectId}`, "layout");
  return NextResponse.json({ ok: true, ...result.data });
}

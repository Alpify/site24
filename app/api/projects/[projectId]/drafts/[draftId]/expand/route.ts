import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { expandDraftForUser } from "@/lib/projects/expand-draft-for-user";

export async function POST(
  _request: Request,
  context: { params: Promise<{ projectId: string; draftId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { projectId, draftId } = await context.params;
  const { searchParams } = new URL(_request.url);
  const localeRaw = searchParams.get("locale")?.trim();
  const locale = localeRaw === "en" ? "en" : "de";

  const result = await expandDraftForUser({
    userId: session.user.id,
    locale,
    projectId,
    draftId,
  });

  if (!result.ok) {
    const status =
      result.error === "forbidden" || result.error === "notfound" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  revalidatePath(`/${locale}/app/${projectId}`, "layout");

  return NextResponse.json({ ok: true });
}

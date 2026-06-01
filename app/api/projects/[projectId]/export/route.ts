import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildProjectHtmlExport } from "@/lib/export/build-project-html";
import { getDb } from "@/lib/db";
import { drafts, projects } from "@/lib/db/schema";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;

  const accept = request.headers.get("accept-language")?.toLowerCase() ?? "";
  const locale = accept.includes("en") && !accept.includes("de") ? "en" : "de";

  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const draftRows = await getDb()
    .select()
    .from(drafts)
    .where(eq(drafts.projectId, projectId))
    .orderBy(desc(drafts.createdAt));

  const html = buildProjectHtmlExport({
    project,
    draftRows,
    locale,
  });

  const safeName = project.name.replace(/[^\w\-]+/g, "-").slice(0, 60) || "site";

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}.html"`,
    },
  });
}

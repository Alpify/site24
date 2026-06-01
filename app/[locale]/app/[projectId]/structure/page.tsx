import { redirect } from "next/navigation";

/** Legacy URL: /structure → Baukasten */
export default async function LegacyStructureRedirect({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  redirect(`/${locale}/app/${projectId}/builder`);
}

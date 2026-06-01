import { redirect } from "next/navigation";

export default async function LegacyContentRedirect({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  redirect(`/${locale}/app/${projectId}/polish`);
}

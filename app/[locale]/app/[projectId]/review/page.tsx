import { redirect } from "next/navigation";

export default async function LegacyReviewRedirect({
  params,
}: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  redirect(`/${locale}/app/${projectId}/hosting`);
}

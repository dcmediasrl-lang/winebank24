import { redirect } from "next/navigation";

export default async function CantinaProfiloPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/cantina/impostazioni?tab=profilo`);
}

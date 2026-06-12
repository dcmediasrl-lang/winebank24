import { redirect } from "next/navigation";

export default async function AssicurazionePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/cantina/impostazioni?tab=documenti`);
}

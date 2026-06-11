import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CantinaPostForm } from "@/components/cantina/cantina-post-form";

export default async function NewCantinaPostPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") redirect(`/${lang}/login`);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nuovo articolo</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">
          Crea un articolo per il blog della piattaforma
        </p>
      </div>
      <CantinaPostForm lang={lang} />
    </div>
  );
}

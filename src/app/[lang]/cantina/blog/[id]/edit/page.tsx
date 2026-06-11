import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { CantinaPostForm } from "@/components/cantina/cantina-post-form";

export default async function EditCantinaPostPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") redirect(`/${lang}/login`);

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) redirect(`/${lang}/cantina`);

  const post = await db.blogPost.findFirst({
    where: { id, cantinaId: cantina.id },
  });
  if (!post) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Modifica articolo</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1 truncate">{post.titleIt}</p>
      </div>
      <CantinaPostForm lang={lang} post={post} />
    </div>
  );
}

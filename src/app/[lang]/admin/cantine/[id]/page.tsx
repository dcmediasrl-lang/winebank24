import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CantinaEditForm } from "@/components/admin/cantina-edit-form";

export default async function AdminCantinaDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;

  const cantina = await db.cantina.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isBlocked: true,
          emailVerified: true,
          createdAt: true,
        },
      },
      _count: { select: { nfts: true, collections: true } },
    },
  });

  if (!cantina) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${lang}/admin/cantine`}
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Cantine
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-white font-semibold">{cantina.name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Gestione cantina</h1>
        <p className="text-white/40 text-sm mt-1">
          Registrata il {new Date(cantina.createdAt).toLocaleDateString("it-IT")} ·
          Account: {cantina.user.email}
        </p>
      </div>

      <CantinaEditForm cantina={JSON.parse(JSON.stringify(cantina))} />
    </div>
  );
}

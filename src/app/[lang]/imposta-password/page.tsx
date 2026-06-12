import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default async function ImpostaPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { lang } = await params;
  const { token } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0705] p-4">
      <Suspense>
        <SetPasswordForm token={token ?? ""} lang={lang} />
      </Suspense>
    </div>
  );
}

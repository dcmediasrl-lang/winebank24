import Link from "next/link";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStripe } from "@/lib/stripe";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { lang } = await params;
  const { session_id } = await searchParams;

  let productName: string | null = null;
  let isFraction = false;

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      isFraction = session.metadata?.type === "fraction";
      const lineItem = session.line_items?.data?.[0];
      productName = lineItem?.description ?? session.metadata?.nftId ?? null;

      // Try to get the product name from line items
      const fullSession = await getStripe().checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      });
      productName = fullSession.line_items?.data?.[0]?.description ?? productName;
    } catch {
      // If we can't retrieve the session, just show the generic success page
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--wine-bg)] px-4">
      <div className="text-center space-y-6 max-w-md w-full">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">
            {isFraction ? "Quota acquistata!" : "Acquisto completato!"}
          </h1>
          {productName && (
            <p className="text-amber-400 font-medium">{productName}</p>
          )}
          <p className="text-white/60 text-sm leading-relaxed">
            {isFraction
              ? "La tua quota di co-proprietà è stata registrata. Puoi visualizzarla nel tuo portfolio."
              : "Il tuo certificato NFT è ora nel tuo portfolio. Riceverai una email di conferma."}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--wine-border)]" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${lang}/collector/portfolio`}
            className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold gap-2")}
          >
            <Package className="w-4 h-4" />
            Vai al mio Portfolio
          </Link>
          <Link
            href={`/${lang}/marketplace`}
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            <ShoppingBag className="w-4 h-4" />
            Continua a esplorare
          </Link>
        </div>

      </div>
    </div>
  );
}

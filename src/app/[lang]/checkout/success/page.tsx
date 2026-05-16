import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-4 max-w-md px-4">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-stone-900">Acquisto completato!</h1>
        <p className="text-stone-500">
          Il tuo NFT è ora nella tua vetrina. Puoi trovarlo nella sezione "La mia Vetrina".
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/collector/portfolio" className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-600 text-stone-950")}>
            Vai alla mia Vetrina
          </Link>
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline" }))}>
            Continua a esplorare
          </Link>
        </div>
      </div>
    </div>
  );
}

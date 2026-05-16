import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["it", "en"];
const defaultLocale = "it";

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get("accept-language") || "";
  const preferred = acceptLang.split(",")[0].split("-")[0].toLowerCase();
  return locales.includes(preferred) ? preferred : defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale prefix
  const hasLocale = locales.some(
    (locale) =>
      pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (hasLocale) return NextResponse.next();

  // Redirect to locale-prefixed URL
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon|.*\\..*).*)"],
};

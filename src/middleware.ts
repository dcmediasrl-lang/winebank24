import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;

  // "portfolio" rinominato "collezione" (§10: la dashboard non deve
  // richiamare un portafoglio finanziario). I vecchi link restano validi.
  const rinominata = pathname.match(/^\/(it|en)\/(collector|cantina)\/portfolio(\/.*)?$/);
  if (rinominata) {
    const [, lang, area, resto = ""] = rinominata;
    return NextResponse.redirect(
      new URL(`/${lang}/${area}/collezione${resto}${request.nextUrl.search}`, request.url)
    );
  }

  // Legacy auth URLs without lang prefix (NextAuth pages, old links)
  if (/^\/(login|register)(\/|$)/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/it${pathname}${request.nextUrl.search}`, request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

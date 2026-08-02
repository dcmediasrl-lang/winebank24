import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;

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

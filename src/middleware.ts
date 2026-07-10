import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const pathname = request.nextUrl.pathname;

  // Redirect Google OAuth users who haven't completed profile
  if (/\/(it|en)\/collector/.test(pathname)) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (token?.needsProfileCompletion) {
      const lang = pathname.split("/")[1] || "it";
      return NextResponse.redirect(new URL(`/${lang}/complete-profile`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

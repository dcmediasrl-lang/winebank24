export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";

// This endpoint is called by the login form before submitting credentials
// to check if the IP is rate-limited
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = await rateLimit(
    rateLimitKey(ip, "login"),
    10, // 10 attempts
    900  // per 15 minutes
  );

  if (!allowed) {
    return NextResponse.json(
      {
        allowed: false,
        message: `Troppi tentativi di accesso. Riprova dopo le ${new Date(resetAt).toLocaleTimeString("it-IT")}.`,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true, remaining });
}

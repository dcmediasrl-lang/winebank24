export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await db.wineDenomination.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
      ],
      isActive: true,
    },
    take: 10,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(results);
}

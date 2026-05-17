import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ nftId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nftId } = await params;

  await db.favoriteNft.upsert({
    where: { userId_nftId: { userId: session.user.id, nftId } },
    create: { userId: session.user.id, nftId },
    update: {},
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nftId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nftId } = await params;

  await db.favoriteNft.deleteMany({
    where: { userId: session.user.id, nftId },
  });

  return NextResponse.json({ favorited: false });
}

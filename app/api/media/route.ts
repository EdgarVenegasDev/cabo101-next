import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const photos = await prisma.photo.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(photos);
}
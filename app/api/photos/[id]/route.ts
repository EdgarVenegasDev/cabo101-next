//app/api/photos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
export const dynamic = "force-dynamic";
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Eliminar archivo físico (opcional)
  try {
    const filePath = path.join(process.cwd(), "public", photo.url);
    await unlink(filePath);
  } catch (e) {
    console.warn("No se pudo eliminar el archivo físico:", e);
  }

  await prisma.photo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
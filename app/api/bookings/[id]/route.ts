//app/api/bookings/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  // Construir objeto data solo con los campos presentes
  const data: { tripStatus?: string; driverNotes?: string } = {};
  if (body.tripStatus !== undefined) data.tripStatus = body.tripStatus;
  if (body.driverNotes !== undefined) data.driverNotes = body.driverNotes;

  const booking = await prisma.booking.update({
    where: { id: Number(params.id) },
    data,
  });

  return NextResponse.json(booking);
}
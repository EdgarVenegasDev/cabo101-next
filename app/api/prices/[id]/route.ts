//app/api/prices/[id]/route.ts

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const price = await prisma.price.update({
    where: { id: Number(params.id) },
    data: {
      fromZone: body.fromZone,
      toZone: body.toZone,
      vehicleId: Number(body.vehicleId),
      oneWay: Number(body.oneWay),
      roundTrip: Number(body.roundTrip)
    }
  })
  return NextResponse.json(price)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.price.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
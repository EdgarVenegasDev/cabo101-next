//app/api/vehicles/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const vehicle = await prisma.vehicle.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      capacity: Number(body.capacity),
      active: body.active,
      image: body.image,
      annotations: body.annotations,
      description: body.description,
      maxBags: Number(body.maxBags) || 0,
      maxCarryOn: Number(body.maxCarryOn) || 0,
    }
  })
  return NextResponse.json(vehicle)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.vehicle.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
//app/api/zones/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const zone = await prisma.zone.update({
    where: { id: Number(params.id) },
    data: {
      slug: body.slug,
      name: body.name,
      latMin: body.latMin ? parseFloat(body.latMin) : null,
      latMax: body.latMax ? parseFloat(body.latMax) : null,
      lngMin: body.lngMin ? parseFloat(body.lngMin) : null,
      lngMax: body.lngMax ? parseFloat(body.lngMax) : null,
      isAirport: body.isAirport || false
    }
  })
  return NextResponse.json(zone)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.zone.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ success: true })
}
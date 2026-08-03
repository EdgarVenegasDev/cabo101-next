//app/api/zones/route.ts

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await prisma.zone.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(zones)
}

export async function POST(req: Request) {
  const body = await req.json()
  const zone = await prisma.zone.create({
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
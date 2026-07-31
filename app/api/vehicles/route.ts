//app/api/vehicles/route.ts

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(vehicles, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

export async function POST(req: Request) {
  const body = await req.json()
  const vehicle = await prisma.vehicle.create({
    data: {
      name: body.name,
      capacity: Number(body.capacity),
      active: body.active ?? true,
      image: body.image || null,
      annotations: body.annotations || null,
      description: body.description || null,
    }
  })
  return NextResponse.json(vehicle)
}
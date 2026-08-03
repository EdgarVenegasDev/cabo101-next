//app/api/prices/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await prisma.price.findMany({
    orderBy: { id: 'asc' },
    include: { vehicle: true }
  })
  return NextResponse.json(prices)
}

export async function POST(req: Request) {
  const body = await req.json()
  // body debe incluir: fromZone, toZone, vehicleId, oneWay, roundTrip
  const price = await prisma.price.create({
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
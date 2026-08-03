// app/api/pricing/route.ts
// app/api/pricing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPriceFromDB } from "@/lib/pricing";
export const dynamic = "force-dynamic";
// Función auxiliar para obtener zona desde coordenadas (consulta a BD)
async function getZoneFromCoordinates(lat: number, lng: number) {
  const zone = await prisma.zone.findFirst({
    where: {
      latMin: { lte: lat },
      latMax: { gte: lat },
      lngMin: { lte: lng },
      lngMax: { gte: lng },
    },
  });
  return zone;
}

export async function POST(req: Request) {
  try {
    console.log("PRICING API HIT");

    const { fromLat, fromLng, toLat, toLng, vehicle, tripType } = await req.json();

    // Validar coordenadas
    if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Obtener zonas desde BD
    const fromZone = await getZoneFromCoordinates(Number(fromLat), Number(fromLng));
    const toZone = await getZoneFromCoordinates(Number(toLat), Number(toLng));

    if (!fromZone) {
      return NextResponse.json({ error: "Origin zone not found" }, { status: 400 });
    }
    if (!toZone) {
      return NextResponse.json({ error: "Destination zone not found" }, { status: 400 });
    }

    // Obtener precio desde BD (función del nuevo sistema)
    const price = await getPriceFromDB(
      fromZone.slug,
      toZone.slug,
      vehicle,
      tripType === "round" ? "round" : "oneway"
    );

    console.log("FROM:", fromZone.slug);
    console.log("TO:", toZone.slug);
    console.log("TRIP TYPE:", tripType);
    console.log("VEHICLE:", vehicle);
    console.log("PRICE:", price);

    if (price === null) {
      return NextResponse.json(
        {
          error: "Price not available for this route",
          fromZone: fromZone.slug,
          toZone: toZone.slug,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fromZone: fromZone.slug,
      toZone: toZone.slug,
      vehicle,
      tripType,
      priceUSD: price,
    });
  } catch (error) {
    console.error("PRICING ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
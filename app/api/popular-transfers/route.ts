// app/api/popular-transfers/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

type ZoneBounds = {
  latMin: number | null;
  latMax: number | null;
  lngMin: number | null;
  lngMax: number | null;
};

// Punto central del bounding box de la zona. BookingContent/`/api/pricing`
// necesitan una coordenada (lat/lng) para volver a ubicar la zona y
// recalcular el precio exactamente igual que lo hace el buscador normal
// (BookingForm), que siempre manda coordenadas reales de Google Places.
// Si a la zona le faltan límites, devolvemos null y esa tarjeta se filtra
// más abajo (mismo caso que "Zonas sin ningún precio configurado" que
// vimos en el admin: si no tiene bounds, no podemos geolocalizarla).
function zoneCenter(zone: ZoneBounds) {
  if (
    zone.latMin === null ||
    zone.latMax === null ||
    zone.lngMin === null ||
    zone.lngMax === null
  ) {
    return null;
  }
  return {
    lat: (zone.latMin + zone.latMax) / 2,
    lng: (zone.lngMin + zone.lngMax) / 2,
  };
}

export async function GET() {
  const airport = await prisma.zone.findFirst({ where: { isAirport: true } });
  if (!airport) return NextResponse.json([]);

  const airportCenter = zoneCenter(airport);

  const populars = await prisma.popularTransfer.findMany({
    where: { active: true },
    include: { zone: true, vehicle: true },
    orderBy: { sortOrder: 'asc' },
  });

  const transfers = await Promise.all(
  populars.map(async (item: (typeof populars)[number]) => {
      const price = await prisma.price.findFirst({
        where: {
          fromZone: airport.slug,
          toZone: item.zone.slug,
          vehicleId: item.vehicleId,
        },
      });
      const roundTripPrice = price?.roundTrip ?? null;
      const oneWayPrice = price?.oneWay ?? null;
      const destCenter = zoneCenter(item.zone);

      return {
        title: item.zone.name,
        slug: item.zone.slug,
        subtitle: item.travelTime,
        price: roundTripPrice ? `$${roundTripPrice} USD` : 'Consultar',
        roundTripPriceUSD: roundTripPrice,
        oneWayPriceUSD: oneWayPrice,
        tag: null,
        image: item.image || '/images/san jose del cabo.jpg',
        // Necesarios para que /booking recalcule el precio correctamente
        // en vez de mostrar $0 por falta de coordenadas.
        vehicleName: item.vehicle.name,
        vehicleCapacity: item.vehicle.capacity,
        fromLat: airportCenter?.lat ?? null,
        fromLng: airportCenter?.lng ?? null,
        toLat: destCenter?.lat ?? null,
        toLng: destCenter?.lng ?? null,
      };
    })
  );

  // Se descartan tarjetas sin NINGÚN precio configurado (ni one way ni
  // round trip) y tarjetas cuya zona (origen o destino) no tenga límites
  // lat/lng definidos, ya que sin coordenadas /booking no puede
  // recalcular el precio. Si solo tiene uno de los dos precios, la
  // tarjeta igual se muestra — el toggle en el frontend deshabilita la
  // opción que no esté disponible para esa ruta.
  const availableTransfers = transfers.filter(
  (t: (typeof transfers)[number]) =>
      (t.oneWayPriceUSD !== null || t.roundTripPriceUSD !== null) &&
      t.fromLat !== null &&
      t.toLat !== null
  );
  return NextResponse.json(availableTransfers);
}
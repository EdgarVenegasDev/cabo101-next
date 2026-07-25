// app/booking/bookingContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import VehicleSelector from "@/components/VehicleSelector";
import CheckoutForm from "@/components/CheckoutForm";
import BookingSummary from "@/components/BookingSummary";

type Vehicle = {
  name: string;
  capacity: string;
  image: string;
  maxPassengers: number;
  annotations: string[];
};

type ApiVehicle = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
  image?: string | null;
  annotations?: string | null;
};

const DEFAULT_VEHICLE_IMAGES: Record<string, string> = {
  SUV: "/images/suv.png",
  VAN: "/images/van.png",
  SPRINTER: "/images/splinter.png",
};
const FALLBACK_VEHICLE_IMAGE = "/images/van.png";

const FALLBACK_VEHICLES: Vehicle[] = [
  { name: "SUV", capacity: "6", image: "/images/suv.png", maxPassengers: 6, annotations: [] },
  { name: "VAN", capacity: "11", image: "/images/van.png", maxPassengers: 11, annotations: [] },
  { name: "SPRINTER", capacity: "19", image: "/images/splinter.png", maxPassengers: 19, annotations: [] },
];

// Convierte "Direct ride - no stops\nDriver may not speak English" (como
// se captura en /admin/vehicles) en un arreglo de anotaciones limpias.
function parseAnnotations(raw?: string | null): string[] {
  return (raw || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapApiVehicle(v: ApiVehicle): Vehicle {
  return {
    name: v.name,
    // Antes esto era `Up to ${v.capacity}` — pero VehicleSelector y
    // BookingSummary ya anteponen su propio "Up to" al mostrarlo, así
    // que salía "Up to Up to 19 passengers". Guardamos solo el número.
    capacity: String(v.capacity),
    image: v.image || DEFAULT_VEHICLE_IMAGES[v.name] || FALLBACK_VEHICLE_IMAGE,
    maxPassengers: v.capacity,
    annotations: parseAnnotations(v.annotations),
  };
}

const inputClass =
  "border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition";
const labelClass = "text-xs font-medium text-gray-500 mb-1 block";

export default function BookingContent() {
  const params = useSearchParams();

  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const passengers = params.get("passengers") || "1";
  const passengerCount = Number(passengers);
  const tripType = params.get("tripType") || "oneway";

  const isFromPopularTransfer = params.get("source") === "popular";

  const [departureDate, setDepartureDate] = useState(params.get("departureDate") || "");
  const [returnDate, setReturnDate] = useState(params.get("returnDate") || "");
  const [specificAddress, setSpecificAddress] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const resolvedTo =
    isFromPopularTransfer && specificAddress.trim()
      ? `${specificAddress.trim()}, ${to}`
      : to;

  const missingPopularDetails =
    isFromPopularTransfer &&
    (!departureDate || (tripType === "round" && !returnDate) || !specificAddress.trim());

  const fromLatRaw = params.get("fromLat") || "";
  const fromLngRaw = params.get("fromLng") || "";
  const toLatRaw   = params.get("toLat") || "";
  const toLngRaw   = params.get("toLng") || "";

  const hasCoordinates =
    fromLatRaw && fromLngRaw && toLatRaw && toLngRaw;

  const fromLat = Number(fromLatRaw);
  const fromLng = Number(fromLngRaw);
  const toLat   = Number(toLatRaw);
  const toLng   = Number(toLngRaw);

  const isValidCoordinates =
    hasCoordinates &&
    !Number.isNaN(fromLat) &&
    !Number.isNaN(fromLng) &&
    !Number.isNaN(toLat) &&
    !Number.isNaN(toLng);

  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK_VEHICLES);
  const [vehicle, setVehicle] = useState<Vehicle>(FALLBACK_VEHICLES[0]);
  const [priceUSD, setPriceUSD] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [fromZone, setFromZone] = useState("");
  const [toZone, setToZone] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data: ApiVehicle[]) => {
        if (!active) return;
        const activeVehicles = data.filter((v) => v.active !== false).map(mapApiVehicle);
        if (activeVehicles.length > 0) {
          setVehicles(activeVehicles);
          setVehicle((prev) =>
            activeVehicles.find((v) => v.name === prev.name) || activeVehicles[0]
          );
        }
      })
      .catch((err) => {
        console.error("Error cargando vehículos, usando respaldo local:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (vehicle.maxPassengers >= passengerCount) return;

    const bigEnough = [...vehicles]
      .sort((a, b) => a.maxPassengers - b.maxPassengers)
      .find((v) => v.maxPassengers >= passengerCount);

    if (bigEnough) setVehicle(bigEnough);
  }, [passengerCount, vehicle, vehicles]);

  useEffect(() => {
    let mounted = true;

    if (!isValidCoordinates) {
      if (mounted) {
        setPriceUSD(null);
        setFromZone("");
        setToZone("");
      }
      return;
    }

    async function calculatePrice() {
      setLoadingPrice(true);
      try {
        const res = await fetch("/api/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromLat,
            fromLng,
            toLat,
            toLng,
            vehicle: vehicle.name,
            tripType,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Error fetching price");
        }

        if (!mounted) return;

        if (typeof data.priceUSD === "number") {
          setPriceUSD(data.priceUSD);
        } else {
          setPriceUSD(null);
        }

        if (data.fromZone) setFromZone(data.fromZone);
        if (data.toZone) setToZone(data.toZone);
      } catch (error) {
        console.error("Error al obtener precio:", error);
        if (!mounted) return;
        setPriceUSD(null);
        setFromZone("");
        setToZone("");
      } finally {
        if (mounted) setLoadingPrice(false);
      }
    }

    calculatePrice();

    return () => {
      mounted = false;
    };
    }, [
        fromLat,
        fromLng,
        toLat,
        toLng,
        vehicle.name,
        tripType,
        isValidCoordinates,
    ]);

    const availableVehicles = vehicles.map((v) => ({
    ...v,
    disabled: passengerCount > v.maxPassengers,
    }));

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-black">
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Image src="/images/logo-color.png" alt="Cabo101" width={40} height={40} />
          </Link>
          <div className="text-sm text-gray-500">Step 2 of 2</div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto mb-10">
          <h1 className="text-3xl font-semibold">Details & payment</h1>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            {isFromPopularTransfer && (
              <div className="bg-white rounded-2xl border border-teal-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Complete your trip details
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Since you booked this from a quick transfer card, we just
                    need a couple more details before you continue.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Departure date</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {tripType === "round" && (
                    <div>
                      <label className={labelClass}>Return date</label>
                      <input
                        type="date"
                        min={departureDate || todayStr}
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    Hotel, villa, or address in {to}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hotel Riu Santa Fe, Villa del Mar 12..."
                    value={specificAddress}
                    onChange={(e) => setSpecificAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {missingPopularDetails && (
                  <p className="text-xs text-amber-600">
                    Please complete these fields to continue to payment.
                  </p>
                )}
              </div>
            )}

            <VehicleSelector
            vehicles={availableVehicles}
            selected={vehicle}
            onSelect={setVehicle}
            passengerCount={passengerCount}
            />

            <CheckoutForm
              vehicle={vehicle}
              priceUSD={priceUSD}
              from={from}
              to={resolvedTo}
              passengers={passengers}
              departureDate={departureDate}
              returnDate={returnDate}
              tripType={tripType as "oneway" | "round"}
              disableContinue={missingPopularDetails}
            />
          </div>

          <div className="lg:sticky top-10 h-fit">
            <BookingSummary
              from={from}
              to={resolvedTo}
              vehicle={vehicle}
              priceUSD={priceUSD}
              passengers={passengers}
              departureDate={departureDate}
              returnDate={returnDate}
              tripType={tripType as "oneway" | "round"}
              fromZone={fromZone}
              toZone={toZone}
              isLoadingPrice={loadingPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
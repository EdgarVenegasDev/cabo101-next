// app/our-fleet/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";
import Reveal, { FadeIn } from "@/components/Reveal";

type ApiVehicle = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
  image?: string | null;
  description?: string | null;
};

// Ancho de cada tarjeta del carrusel — se usa también para calcular el
// padding lateral que permite centrar la primera y la última tarjeta.
const CARD_WIDTH = 280;

function ChevronIcon({
  className,
  direction = "right",
}: {
  className?: string;
  direction?: "left" | "right";
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function FleetSkeleton() {
  return (
    <div className="flex items-center justify-center gap-8 py-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex-shrink-0 animate-pulse ${i === 1 ? "" : "scale-75 opacity-50"}`}
          style={{ width: CARD_WIDTH }}
        >
          <div className="rounded-2xl bg-gray-100 h-48" />
          <div className="h-4 w-24 bg-gray-100 rounded mt-3 mx-auto" />
        </div>
      ))}
    </div>
  );
}

export default function OurFleetPage() {
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data: ApiVehicle[]) => {
        setVehicles(data.filter((v) => v.active !== false));
      })
      .catch((err) => console.error("Error cargando la flota:", err))
      .finally(() => setLoading(false));
  }, []);

  const selectVehicle = (index: number) => {
    const clamped = Math.max(0, Math.min(index, vehicles.length - 1));
    setSelectedIndex(clamped);
    cardRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") selectVehicle(selectedIndex + 1);
    if (e.key === "ArrowLeft") selectVehicle(selectedIndex - 1);
  };

  const selected = vehicles[selectedIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar necesita un fondo oscuro para verse (fue diseñado para
          ir sobre el video del Hero); aquí no hay video, así que se le
          da una barra de fondo teal, igual al color del Footer. */}
      <div className="bg-teal-900 px-4 sm:px-6 md:px-10 lg:px-20 pt-4 pb-2">
        <Navbar />
      </div>

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="px-4 sm:px-6 md:px-10 lg:px-20">
          <Reveal className="max-w-7xl mx-auto mb-12 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
              Our Fleet
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
              A vehicle for every group
            </h1>
          </Reveal>
        </div>

        {loading ? (
          <FleetSkeleton />
        ) : vehicles.length === 0 ? (
          <p className="text-center text-gray-400">No vehicles available yet.</p>
        ) : (
          <>
            {/* Carrusel tipo "coverflow": el vehículo seleccionado se ve
                grande y centrado; los demás, más chicos y semivisibles
                a los lados. Se navega con clic, flechas del teclado
                (con el carrusel enfocado), deslizando, o con las
                flechas visibles en pantallas medianas y grandes. */}
            <div className="relative">
              <button
                onClick={() => selectVehicle(selectedIndex - 1)}
                disabled={selectedIndex === 0}
                aria-label="Previous vehicle"
                className="hidden md:flex absolute left-4 lg:left-10 top-[104px] -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronIcon className="w-5 h-5" direction="left" />
              </button>
              <button
                onClick={() => selectVehicle(selectedIndex + 1)}
                disabled={selectedIndex === vehicles.length - 1}
                aria-label="Next vehicle"
                className="hidden md:flex absolute right-4 lg:right-10 top-[104px] -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronIcon className="w-5 h-5" />
              </button>

              <div
                tabIndex={0}
                onKeyDown={handleKeyDown}
                aria-label="Fleet carousel, use arrow keys to navigate"
                className="flex items-center gap-8 overflow-x-auto snap-x snap-mandatory py-6 focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  paddingLeft: `calc(50% - ${CARD_WIDTH / 2}px)`,
                  paddingRight: `calc(50% - ${CARD_WIDTH / 2}px)`,
                }}
              >
                {vehicles.map((v, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={v.id}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      onClick={() => selectVehicle(index)}
                      className={`flex-shrink-0 snap-center cursor-pointer transition-all duration-500 ${
                        isSelected ? "scale-100 opacity-100" : "scale-75 opacity-40"
                      }`}
                      style={{ width: CARD_WIDTH }}
                    >
                      <div
                        className={`rounded-2xl bg-gray-50 border overflow-hidden ${
                          isSelected ? "border-teal-300 shadow-xl" : "border-gray-100"
                        }`}
                      >
                        <div className="relative h-48 flex items-center justify-center p-6">
                          {v.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.image}
                              alt={v.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-300 text-sm">No image</div>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-center mt-3 font-semibold transition-colors ${
                          isSelected ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {v.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indicadores de posición */}
            <div className="flex justify-center gap-2 mt-2">
              {vehicles.map((v, index) => (
                <button
                  key={v.id}
                  onClick={() => selectVehicle(index)}
                  aria-label={`Show ${v.name}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "w-6 bg-teal-600"
                      : "w-1.5 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Descripción dinámica: cambia según el vehículo
                seleccionado (Vehicle.description, editable desde
                /admin/vehicles). Se desvanece al cambiar de vehículo. */}
            {selected && (
              <FadeIn key={selected.id} className="max-w-2xl mx-auto text-center px-4 mt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selected.name}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Up to {selected.capacity} passengers
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {selected.description ||
                    "Comfortable, reliable, and ready for your Los Cabos adventure."}
                </p>
              </FadeIn>
            )}
          </>
        )}
      </section>

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}
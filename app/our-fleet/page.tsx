// app/our-fleet/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";

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
    setSelectedIndex(index);
    cardRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
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
          <div className="max-w-7xl mx-auto mb-12 text-center">
            <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
              Our Fleet
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
              A vehicle for every group
            </h1>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-gray-400">No vehicles available yet.</p>
        ) : (
          <>
            {/* Carrusel tipo "coverflow": el vehículo seleccionado se ve
                grande y centrado; los demás, más chicos y semivisibles
                a los lados. Se navega haciendo clic en cualquiera (se
                centra solo con scrollIntoView) o deslizando con el
                dedo/mouse — sin necesidad de calcular manualmente
                transforms para cada tamaño de pantalla. */}
            <div
              className="flex items-center gap-8 overflow-x-auto snap-x snap-mandatory py-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

            {/* Descripción dinámica: cambia según el vehículo
                seleccionado (Vehicle.description, editable desde
                /admin/vehicles). */}
            {selected && (
              <div className="max-w-2xl mx-auto text-center px-4 mt-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selected.name}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Up to {selected.capacity} passengers
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {selected.description ||
                    "Comfortable, reliable, and ready for your Los Cabos adventure."}
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}
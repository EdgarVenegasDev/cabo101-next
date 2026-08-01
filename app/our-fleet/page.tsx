// app/our-fleet/page.tsx
"use client";

import { useRef, useState, useEffect } from "react";
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
  maxBags?: number;
  maxCarryOn?: number;
};

function PassengersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CarryOnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M10 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  );
}

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
    <div className="flex items-center justify-center gap-6 py-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex-shrink-0 animate-pulse ${i === 1 ? "" : "scale-75 opacity-50"}`}
          style={{ width: 260 }}
        >
          <div className="rounded-2xl bg-gray-100 h-72" />
          <div className="h-4 w-24 bg-gray-100 rounded mt-3 mx-auto" />
        </div>
      ))}
    </div>
  );
}

/* Cuánto se traslada, escala, rota e desvanece cada tarjeta según su
   distancia (offset) al vehículo seleccionado. offset 0 = centro. El
   traslado usa vw con un tope en px para que se vea bien tanto en
   celular como en pantallas grandes, sin necesidad de medir el ancho
   de la ventana en JS. */
function getCardStyle(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);
  const rotateY = Math.max(-40, Math.min(40, -offset * 32));
  const scale = offset === 0 ? 1 : Math.max(0.58, 1 - abs * 0.17);
  const opacity = abs <= 3 ? Math.max(0, 1 - abs * 0.3) : 0;

  return {
    transform: `translateX(-50%) translateX(calc(${offset} * min(46vw, 480px))) scale(${scale}) rotateY(${rotateY}deg)`,
    opacity,
    zIndex: 50 - abs,
    pointerEvents: abs > 3 ? "none" : "auto",
  };
}

export default function OurFleetPage() {
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const dragStartX = useRef<number | null>(null);
  const draggedRef = useRef(false);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data: ApiVehicle[]) => {
        const activeVehicles = data.filter((v) => v.active !== false);
        setVehicles(activeVehicles);

        // Iniciar en el vehículo del centro, sin importar cuántos haya.
        setSelectedIndex(Math.floor(activeVehicles.length / 2));
      })
      .catch((err) => console.error("Error cargando la flota:", err))
      .finally(() => setLoading(false));
  }, []);

  const selectVehicle = (index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, vehicles.length - 1)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") selectVehicle(selectedIndex + 1);
    if (e.key === "ArrowLeft") selectVehicle(selectedIndex - 1);
  };

  // Deslizar con el dedo o el mouse, en cualquiera de las dos
  // direcciones, para pasar al vehículo anterior/siguiente.
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    draggedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    if (Math.abs(e.clientX - dragStartX.current) > 8) draggedRef.current = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    const THRESHOLD = 50;
    if (delta > THRESHOLD) selectVehicle(selectedIndex - 1);
    else if (delta < -THRESHOLD) selectVehicle(selectedIndex + 1);
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
            {/* Carrusel giratorio: el vehículo seleccionado queda al
                centro, grande y protagonista; los demás se reparten a
                los lados, más chicos, girados en el eje Y y
                desvanecidos según qué tan lejos están del centro.
                Navega con clic sobre cualquier tarjeta visible, con
                las flechas, arrastrando con el dedo/mouse hacia
                cualquier lado, o con las flechas del teclado (carrusel
                enfocado). */}
            <div className="relative">
              <button
                onClick={() => selectVehicle(selectedIndex - 1)}
                disabled={selectedIndex === 0}
                aria-label="Previous vehicle"
                className="hidden md:flex absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronIcon className="w-5 h-5" direction="left" />
              </button>
              <button
                onClick={() => selectVehicle(selectedIndex + 1)}
                disabled={selectedIndex === vehicles.length - 1}
                aria-label="Next vehicle"
                className="hidden md:flex absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronIcon className="w-5 h-5" />
              </button>

              <div
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={() => {
                  dragStartX.current = null;
                }}
                aria-label="Fleet carousel, drag or use arrow keys to navigate"
                className="relative h-[520px] sm:h-[620px] md:h-[720px] cursor-grab active:cursor-grabbing select-none touch-pan-y"
                style={{ perspective: "1400px" }}
              >
                {vehicles.map((v, index) => {
                  const offset = index - selectedIndex;
                  const isSelected = offset === 0;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        if (draggedRef.current) return; // fue un swipe, no un tap
                        selectVehicle(index);
                      }}
                      className="absolute top-0 left-1/2 w-[360px] sm:w-[480px] md:w-[600px] cursor-pointer transition-all duration-500 ease-out"
                      style={getCardStyle(offset)}
                    >
                      <div className="relative h-[360px] sm:h-[480px] md:h-[580px] flex items-center justify-center">
                        {v.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.image}
                            alt={v.name}
                            draggable={false}
                            className={`max-h-full max-w-full object-contain pointer-events-none transition-[filter] duration-500 ${
                              isSelected ? "drop-shadow-2xl" : ""
                            }`}
                          />
                        ) : (
                          <div className="text-gray-300 text-sm">No image</div>
                        )}
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
                /admin/vehicles). Se desvanece al cambiar de vehículo.
                El nombre ya se ve debajo de cada tarjeta del carrusel,
                así que aquí no se repite — en su lugar van las
                características (capacidad, maletas, carry-ons). */}
            {selected && (
              <FadeIn key={selected.id} className="max-w-2xl mx-auto px-4 mt-12">
                <div className="border border-gray-200 rounded-2xl px-6 py-8 sm:px-10 sm:py-10 text-center">
                  <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-4">
                    Características
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {selected.description ||
                      "Comfortable, reliable, and ready for your Los Cabos adventure."}
                  </p>
                </div>
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
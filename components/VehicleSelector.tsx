//components/VehicleSelector.tsx

"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Vehicle = {
  name: string;
  capacity: string;
  image: string;
  maxPassengers: number;
  disabled?: boolean;
  // No opcional: BookingContent siempre manda un arreglo (aunque esté
  // vacío), nunca undefined. Si esto quedara opcional aquí mientras en
  // BookingContent es obligatorio, TypeScript trata ambos "Vehicle"
  // como tipos incompatibles aunque se llamen igual — eso causaba el
  // error de build en onSelect={setVehicle}.
  annotations: string[];
  // Capacidad de equipaje del vehículo (fija, configurada en
  // /admin/vehicles) — no depende de cuántos pasajeros tenga ESTA
  // reserva, es cuánto cabe físicamente en el vehículo.
  maxBags: number;
  maxCarryOn: number;
};

type Props = {
  vehicles: Vehicle[];
  selected: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
  // Cantidad real de pasajeros de ESTA reserva (no la capacidad máxima
  // del vehículo) — se sigue mostrando junto a los íconos de equipaje
  // para dar contexto de cuántos van, aunque el equipaje ya no se
  // calcule a partir de este número.
  passengerCount: number;
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

export default function VehicleSelector({ vehicles, selected, onSelect, passengerCount }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {vehicles.map((v, index) => {
        const active = selected.name === v.name;

        return (
          <motion.div
            key={v.name}
            onClick={() => {
              if (!v.disabled) {
                onSelect(v);
              }
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={v.disabled ? {} : { scale: 1.01 }}
            whileTap={v.disabled ? {} : { scale: 0.98 }}
            className={`
            flex items-start justify-between gap-4 p-4
            transition-all duration-300
            ${
                v.disabled
                ? "opacity-40 cursor-not-allowed bg-gray-50"
                : active
                ? "bg-gray-100 cursor-pointer"
                : "hover:bg-gray-50 cursor-pointer"
            }
            ${index !== vehicles.length - 1 ? "border-b border-gray-200" : ""}
            `}
          >
            {/* LEFT SIDE — el nombre va arriba, como encabezado de toda
                la tarjeta, y debajo la imagen junto con el resto de la
                información. */}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">{v.name}</p>

              <div className="flex items-start gap-4 min-w-0 mt-2">
                <motion.div whileHover={{ scale: 1.08 }} className="bg-gray-50 rounded-lg p-2 flex-shrink-0">
                  <Image src={v.image} alt={v.name} width={90} height={50} className="object-contain" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500">Up to {v.capacity} passengers</p>
                  {v.disabled && (
                  <p className="text-xs text-red-500 mt-1">
                      Not enough capacity
                  </p>
                  )}

                  {/* Anotaciones libres (una por línea en Vehicle.annotations,
                      editables desde /admin/vehicles) — en columna, una
                      debajo de otra, no en una sola línea. */}
                  {v.annotations && v.annotations.length > 0 && (
                    <div className="flex flex-col items-start gap-1.5 mt-2">
                      {v.annotations.map((note, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pasajeros de esta reserva + capacidad máxima de
                      equipaje del vehículo (fija, no calculada a partir
                      de passengerCount) */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <PassengersIcon className="w-3.5 h-3.5" />
                      {passengerCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <BagIcon className="w-3.5 h-3.5" />
                      {v.maxBags} bag{v.maxBags === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <CarryOnIcon className="w-3.5 h-3.5" />
                      {v.maxCarryOn} carry-on{v.maxCarryOn === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE – sin precio fijo */}
            <div className="text-right flex-shrink-0">
              {active && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-green-600 font-medium"
                >
                  Selected
                </motion.p>
              )}
              <p className="text-xs text-gray-400 mt-1">Dynamic pricing</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
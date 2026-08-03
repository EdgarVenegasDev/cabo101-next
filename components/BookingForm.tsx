// components/BookingForm.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useGoogleMaps from "@/lib/useGoogleMaps";
import MapModal from "@/components/MapModal";


type PlaceLike = {
  name?: string;
  formatted_address?: string;
  isCustomLocation?: boolean;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
};

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: Record<string, unknown>
          ) => {
            addListener: (event: string, handler: () => void) => void;
            getPlace: () => PlaceLike;
          };
        };
        LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
        LatLng: new (lat: number, lng: number) => unknown;
      };
    };
  }
}

export default function BookingForm({ tripType }: { tripType: "oneway" | "round" }) {
  const router = useRouter();
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef   = useRef<HTMLInputElement>(null);
  const fromPlaceRef = useRef<PlaceLike | null>(null);
  const toPlaceRef   = useRef<PlaceLike | null>(null);

  const [loading, setLoading] = useState(false);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate]       = useState("");
  const [showDepartureCalendar, setShowDepartureCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar]       = useState(false);

  const mapsLoaded = useGoogleMaps();

  const [showMapModal, setShowMapModal] = useState(false);
  const [selectingFromLocation, setSelectingFromLocation] = useState(false);
  const [selectingToLocation, setSelectingToLocation]     = useState(false);

  const [customFrom, setCustomFrom] = useState(false);
  const [customTo,   setCustomTo]   = useState(false);

  useEffect(() => {
    if (!mapsLoaded || !window.google?.maps?.places) return;

    try {
      const options = {
        componentRestrictions: { country: "mx" },
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(22.5, -110.5),
          new window.google.maps.LatLng(25.5, -108.5)
        ),
        strictBounds: true,
        fields: ["geometry", "formatted_address", "name", "types"],
      };

      if (fromRef.current) {
        const fromAuto = new window.google.maps.places.Autocomplete(fromRef.current, options);
        fromAuto.addListener("place_changed", () => {
          const place = fromAuto.getPlace();
          if (place?.geometry && fromRef.current) {
            fromPlaceRef.current = place;
            fromRef.current.value = place.name ?? place.formatted_address ?? "";
            setCustomFrom(false);
          }
        });
      }

      if (toRef.current) {
        const toAuto = new window.google.maps.places.Autocomplete(toRef.current, options);
        toAuto.addListener("place_changed", () => {
          const place = toAuto.getPlace();
          if (place?.geometry && toRef.current) {
            toPlaceRef.current = place;
            toRef.current.value = place.name ?? place.formatted_address ?? "";
            setCustomTo(false);
          }
        });
      }
    } catch (error) {
      console.error("Error inicializando Google Places:", error);
    }
  }, [mapsLoaded]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fromPlace = fromPlaceRef.current;
    const toPlace   = toPlaceRef.current;

    if (!fromPlace || !toPlace) {
      alert("Please select origin and destination using Google Places or the map.");
      return;
    }
    if (!departureDate) {
      alert("Please select departure date");
      return;
    }
    if (tripType === "round" && !returnDate) {
      alert("Please select return date");
      return;
    }

    const passengers = (e.target as HTMLFormElement).querySelector(
      "#passengers"
    ) as HTMLSelectElement;

    setLoading(true);

    const fromName = fromPlace.name || fromPlace.formatted_address;
    const toName   = toPlace.name   || toPlace.formatted_address;

    const params = new URLSearchParams({
      fromName: fromName!,
      toName: toName!,
      from:     fromPlace.formatted_address!,
      to:       toPlace.formatted_address!,
      fromLat:  String(fromPlace.geometry.location.lat()),
      fromLng:  String(fromPlace.geometry.location.lng()),
      toLat:    String(toPlace.geometry.location.lat()),
      toLng:    String(toPlace.geometry.location.lng()),
      departureDate,
      returnDate: tripType === "round" ? returnDate : "",
      passengers: passengers?.value || "1",
      tripType,
      customFrom: String(customFrom),
      customTo:   String(customTo),
    });

    // Antes esto era window.location.href, que fuerza una recarga
    // completa del navegador. router.push hace la navegación del lado
    // del cliente que ya usa Next.js — reutiliza el JS ya cargado en vez
    // de descargarlo todo de nuevo, así que /booking carga más rápido.
    router.push(`/booking?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
    });
  };

  const CustomCalendar = ({
    selectedDate,
    onDateChange,
    onClose,
  }: {
    selectedDate: string;
    onDateChange: (date: string) => void;
    onClose: () => void;
  }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tempDate, setTempDate] = useState(selectedDate || "");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const MONTHS = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];
    const DOWS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isSelected = (d: number) => {
      if (!tempDate) return false;
      const [y, m, day] = tempDate.split("-").map(Number);
      return y === year && m - 1 === month && day === d;
    };

    const isToday = (d: number) =>
      new Date(year, month, d).toDateString() === today.toDateString();

    const isPast = (d: number) => new Date(year, month, d) < today;

    const handleDayClick = (d: number) => {
      if (isPast(d)) return;
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      setTempDate(`${year}-${mm}-${dd}`);
    };

    const handleConfirm = () => {
      if (tempDate) onDateChange(tempDate);
      onClose();
    };

    const formatFooter = (dateStr: string) => {
      if (!dateStr) return "—";
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        month: "short",
        day:   "numeric",
        year:  "numeric",
      });
    };

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="bg-white rounded-2xl p-5"
          style={{ width: 300, border: "0.5px solid rgba(0,0,0,0.1)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-medium text-gray-800">
              {MONTHS[month]} {year}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-md hover:bg-gray-100 transition text-gray-400 hover:text-gray-800"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-md hover:bg-gray-100 transition text-gray-400 hover:text-gray-800"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DOWS.map((d) => (
              <div key={d} className="text-center pb-2" style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.04em" }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7" style={{ gap: 2 }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d    = i + 1;
              const sel  = isSelected(d);
              const tod  = isToday(d);
              const past = isPast(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  disabled={past}
                  className="relative flex items-center justify-center rounded-lg transition-all"
                  style={{
                    aspectRatio: "1",
                    fontSize:    13,
                    fontWeight:  tod && !sel ? 500 : 400,
                    background:  sel ? "#111827" : "transparent",
                    color:       sel ? "#ffffff" : past ? "#d1d5db" : "#1f2937",
                    cursor:      past ? "default" : "pointer",
                    border:      "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!past && !sel)
                      (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    if (!sel)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {d}
                  {tod && !sel && (
                    <span
                      className="absolute rounded-full"
                      style={{ width: 3, height: 3, background: "#111827", bottom: 3, left: "50%", transform: "translateX(-50%)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "0.5px solid #e5e7eb" }}>
            <div>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Selected</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{formatFooter(tempDate)}</p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!tempDate}
              style={{
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 500,
                cursor: tempDate ? "pointer" : "default",
                opacity: tempDate ? 1 : 0.4,
                transition: "opacity .15s",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl w-full flex flex-col sm:flex-row items-stretch overflow-hidden text-gray-700 shadow-lg"
      >
        <div className="flex-[2] flex items-center gap-2 py-[8.4px] pl-5 pr-4 border-b sm:border-b-0 sm:border-r border-gray-200">
          <Image src="/images/from.png" alt="" width={11} height={11} />
          <input
            ref={fromRef}
            type="text"
            placeholder="From airport, hotel, airbnb"
            className="w-full outline-none text-sm sm:text-base py-[8.4px]"
            onChange={() => {
              fromPlaceRef.current = null;
              setCustomFrom(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSelectingFromLocation(true);
              setSelectingToLocation(false);
              setShowMapModal(true);
            }}
            className="shrink-0"
          >
            <Image src="/images/mapslogo1.png" alt="Custom location" width={18} height={18} />
          </button>
        </div>

        <div className="flex-[2] flex items-center gap-2 pl-5 pr-4 py-[8.4px] border-b sm:border-b-0 sm:border-r border-gray-200">
          <Image src="/images/to.png" alt="" width={15} height={15} />
          <input
            ref={toRef}
            type="text"
            placeholder="To airport, hotel, airbnb"
            className="w-full outline-none text-sm sm:text-base py-[8.4px]"
            onChange={() => {
              toPlaceRef.current = null;
              setCustomTo(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setSelectingToLocation(true);
              setSelectingFromLocation(false);
              setShowMapModal(true);
            }}
            className="shrink-0"
          >
            <Image src="/images/mapslogo1.png" alt="Custom location" width={18} height={18} />
          </button>
        </div>

        <div
          onClick={() => setShowDepartureCalendar(true)}
          className="flex items-center gap-2 px-4 py-[8.4px] flex-1 border-b sm:border-b-0 sm:border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition"
        >
          <Image src="/images/calendar.png" alt="" width={16} height={16} />
          <span className="text-xs sm:text-sm py-[8.4px]">
            {departureDate ? formatDate(departureDate) : "Departure"}
          </span>
        </div>

        {tripType === "round" && (
          <div
            onClick={() => setShowReturnCalendar(true)}
            className="flex items-center gap-2 px-4 py-[8.4px] flex-1 border-b sm:border-b-0 sm:border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition"
          >
            <Image src="/images/calendar.png" alt="" width={16} height={16} />
            <span className="text-xs sm:text-sm py-[8.4px]">
              {returnDate ? formatDate(returnDate) : "Return"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-[8.4px] flex-1 border-b sm:border-b-0 sm:border-r border-gray-200">
          <Image src="/images/user.png" alt="" width={18} height={18} />
          <select id="passengers" className="w-full outline-none text-sm sm:text-base py-[8.4px] bg-white cursor-pointer">
            {[...Array(19)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} Passenger{i > 0 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#4ccb8c] text-white px-4 sm:px-8 py-3 sm:py-0 self-stretch font-semibold transition hover:bg-[#3db37a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {showDepartureCalendar && (
        <CustomCalendar selectedDate={departureDate} onDateChange={setDepartureDate} onClose={() => setShowDepartureCalendar(false)} />
      )}

      {tripType === "round" && showReturnCalendar && (
        <CustomCalendar selectedDate={returnDate} onDateChange={setReturnDate} onClose={() => setShowReturnCalendar(false)} />
      )}

      {showMapModal && (
        <MapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectingFromLocation(false);
            setSelectingToLocation(false);
          }}
          onSelect={(location) => {
            const address = location.address || location.formattedAddress || `${location.lat}, ${location.lng}`;

            const normalizedPlace: PlaceLike = {
              name: address,
              formatted_address: address,
              isCustomLocation: true,
              geometry: {
                location: {
                  lat: () => location.lat,
                  lng: () => location.lng,
                },
              },
            };

            if (selectingFromLocation && fromRef.current) {
              fromRef.current.value = address;
              fromPlaceRef.current = normalizedPlace;
              setCustomFrom(true);
            }

            if (selectingToLocation && toRef.current) {
              toRef.current.value = address;
              toPlaceRef.current = normalizedPlace;
              setCustomTo(true);
            }

            setShowMapModal(false);
            setSelectingFromLocation(false);
            setSelectingToLocation(false);
          }}
        />
      )}

      {/* Estilo del dropdown de Google Places Autocomplete (.pac-container).
          Google lo inyecta directamente en <body>, fuera del control de
          React, así que solo se puede personalizar con CSS global
          apuntando a sus clases públicas. No se tocó ninguna otra parte
          del componente: esto es puramente visual. */}
      <style jsx global>{`
        .pac-container {
          border-radius: 14px;
          margin-top: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          padding: 6px 6px 10px;
          font-family: inherit;
          z-index: 9999;
          max-width: 92vw;
        }

        @media (min-width: 640px) {
          .pac-container {
            min-width: 380px !important;
          }
        }

        .pac-item {
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 1.3;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .pac-item:hover,
        .pac-item-selected {
          background-color: #eafaf1;
        }

        .pac-icon {
          display: none;
        }

        .pac-item::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #4ccb8c;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .pac-item-query {
          font-size: 14px;
          color: #111827;
          padding-right: 4px;
        }

        .pac-matched {
          font-weight: 600;
          color: #0f6e56;
        }

        .pac-item .pac-secondary-text {
          font-size: 12px;
          color: #9ca3af;
          margin-left: 4px;
        }

        /* Ajustes SOLO para móvil: texto un poco más compacto para que
           quepan mejor las sugerencias en pantallas angostas. Desktop
           conserva el tamaño original de arriba. */
        @media (max-width: 639px) {
          .pac-item {
            font-size: 13px;
            padding: 8px 10px;
          }

          .pac-item-query {
            font-size: 13px;
          }

          .pac-item .pac-secondary-text {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
}
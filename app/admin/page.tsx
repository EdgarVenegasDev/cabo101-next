// app/admin/page.tsx

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import PaymentBrick from "@/components/PaymentBrick";
import { buildBookingPayload } from "@/lib/buildBookingPayload";
import type { BrickSubmitData } from "@/types/mercadopago";

export default function AdminDashboard() {
  // ========== FORM STATE ==========
  const [transactionAmount, setTransactionAmount] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [passengers, setPassengers] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(false);
  const [returnPickupLocation, setReturnPickupLocation] = useState("");
  const [returnDropoffLocation, setReturnDropoffLocation] = useState("");
  const [returnPickupTime, setReturnPickupTime] = useState("");
  const [returnPickupDate, setReturnPickupDate] = useState("");
  const [additionalService, setAdditionalService] = useState("0");
  const [airline, setAirline] = useState("");
  const [flight, setFlight] = useState("");
  const [arrival, setArrival] = useState("");
  const [returnFlight, setReturnFlight] = useState("");

  const [loading, setLoading] = useState(false);
  const [showBrick, setShowBrick] = useState(false);

  // 🔗 1. Generar link de pago (Checkout Pro)
  const handleGenerateLink = async () => {
    if (!transactionAmount) return alert("❌ El monto es obligatorio");
    try {
      setLoading(true);
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_amount: Number(transactionAmount),
          email,
          summary,
          firstName,
          lastName,
          phone,
          pickupLocation,
          dropoffLocation,
          passengers,
          vehicleType,
          pickupTime,
          pickupDate,
          roundTrip,
          returnPickupLocation,
          returnDropoffLocation,
          returnPickupTime,
          returnPickupDate,
          additionalService: Number(additionalService),
          airline,
          flight,
          arrival,
          returnFlight,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.url) window.open(data.url, "_blank");
      else alert("Error generando link");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 🚪 2. Abrir página pública de pago (con todos los datos en URL)
  const handleOpenPaymentPage = () => {
    if (!transactionAmount) return alert("❌ El monto es obligatorio");
    const payload = buildBookingPayload({
      transaction_amount: Number(transactionAmount),
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
      phone,
      summary: summary || "Transportation Service",
      pickupLocation,
      dropoffLocation,
      passengers,
      vehicleType,
      pickupDate,
      pickupTime,
      roundTrip,
      returnPickupLocation,
      returnDropoffLocation,
      returnPickupDate,
      returnPickupTime,
      airline,
      flight,
      arrival,
      returnFlight,
      additionalService: Number(additionalService),
      paidAmount: Number(transactionAmount),
    });
    const params = new URLSearchParams(
      Object.entries(payload).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value ?? "");
          return acc;
        },
        {} as Record<string, string>
      )
    );
    window.location.href = `/pay?${params.toString()}`;
  };

  // 💳 3. Mostrar Brick para pago dentro del admin
  const handleShowBrick = () => {
    if (!transactionAmount) return alert("❌ El monto es obligatorio");
    setShowBrick(true);
  };

  const handleAdminPayment = useCallback(
  async (data: BrickSubmitData) => {
      const payload = buildBookingPayload({
        transaction_amount: Number(transactionAmount),
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phone,
        summary: summary || "Transportation Service",
        pickupLocation,
        dropoffLocation,
        passengers,
        vehicleType,
        pickupDate,
        pickupTime,
        roundTrip,
        returnPickupLocation,
        returnDropoffLocation,
        returnPickupDate,
        returnPickupTime,
        airline,
        flight,
        arrival,
        returnFlight,
        additionalService: Number(additionalService),
        paidAmount: Number(transactionAmount),
      });
      const res = await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...payload,
        }),
      });
      const result = await res.json();
      console.log("ADMIN PAYMENT RESULT:", result);
      if (result.status === "approved") alert("✅ Pago aprobado");
      else if (result.status === "pending" || result.status === "in_process")
        alert("⏳ Pago pendiente");
      else alert("❌ Pago fallido");
      return result;
    },
    [
      transactionAmount,
      firstName,
      lastName,
      email,
      summary,
      phone,
      pickupLocation,
      dropoffLocation,
      passengers,
      vehicleType,
      pickupTime,
      pickupDate,
      roundTrip,
      returnPickupLocation,
      returnDropoffLocation,
      returnPickupTime,
      returnPickupDate,
      additionalService,
      airline,
      flight,
      arrival,
      returnFlight,
    ]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-900">Cabo 101 · Admin</span>
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">Dashboard</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Crear reserva ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Nueva reserva</h2>
              <p className="text-xs text-gray-400 mt-0.5">Completa los datos del cliente y el servicio</p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-700 font-medium px-3 py-1 rounded-full border border-teal-100">
              Transporte
            </span>
          </div>

          <div className="p-6 space-y-8">
            {/* ── Sección 1: Cliente ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cliente</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Apellido</label>
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+1 (000) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ── Sección 2: Servicio ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">2</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Servicio</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Descripción</label>
                  <input
                    type="text"
                    placeholder="Ej. Transportation Service"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Tipo de vehículo</label>
                  <input
                    type="text"
                    placeholder="Ej. Suburban SUV"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Origen</label>
                  <input
                    type="text"
                    placeholder="Lugar de recogida"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Destino</label>
                  <input
                    type="text"
                    placeholder="Lugar de destino"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Pasajeros</label>
                  <input
                    type="text"
                    placeholder="Núm. de pasajeros"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ── Sección 3: Vuelo de ida ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">3</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vuelo de ida</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Aerolínea</label>
                  <input
                    type="text"
                    placeholder="Ej. American Airlines"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Número de vuelo</label>
                  <input
                    type="text"
                    placeholder="Ej. AA 1234"
                    value={flight}
                    onChange={(e) => setFlight(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Hora de llegada</label>
                  <input
                    type="time"
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Fecha de recogida</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Hora de recogida</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* ── Sección 4: Viaje de regreso ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">4</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Viaje de regreso</h3>
                <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={roundTrip}
                      onChange={(e) => setRoundTrip(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-checked:bg-teal-600 rounded-full transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {roundTrip ? "Activado" : "Desactivado"}
                  </span>
                </label>
              </div>

              {roundTrip && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Origen de regreso</label>
                      <input
                        type="text"
                        placeholder="Lugar de recogida"
                        value={returnPickupLocation}
                        onChange={(e) => setReturnPickupLocation(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Destino de regreso</label>
                      <input
                        type="text"
                        placeholder="Lugar de destino"
                        value={returnDropoffLocation}
                        onChange={(e) => setReturnDropoffLocation(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Vuelo de regreso</label>
                      <input
                        type="text"
                        placeholder="Ej. AA 5678"
                        value={returnFlight}
                        onChange={(e) => setReturnFlight(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Fecha de regreso</label>
                      <input
                        type="date"
                        value={returnPickupDate}
                        onChange={(e) => setReturnPickupDate(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500">Hora de recogida regreso</label>
                      <input
                        type="time"
                        value={returnPickupTime}
                        onChange={(e) => setReturnPickupTime(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100" />

            {/* ── Sección 5: Pago ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-teal-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">5</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pago</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Monto total <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-7 pr-16 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition font-medium"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">USD</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Servicio adicional</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={additionalService}
                      onChange={(e) => setAdditionalService(e.target.value)}
                      className="border border-gray-200 rounded-lg pl-7 pr-16 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card footer con acciones */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateLink}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {loading ? "Generando..." : "Generar link"}
            </button>
            <button
              onClick={handleOpenPaymentPage}
              className="flex items-center gap-2 bg-teal-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-teal-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Abrir página de pago
            </button>
            <button
              onClick={handleShowBrick}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Cobrar aquí
            </button>
          </div>
        </div>

        {/* ── Tarjetas de acceso rápido ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Reservas */}
          <Link href="/admin/bookings" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Ver reservas</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Listado de todas las reservas de transporte.</p>
          </Link>

          {/* Precios */}
          <Link href="/admin/prices" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Precios</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Gestionar tarifas por ruta y tipo de vehículo.</p>
          </Link>

          {/* Zonas */}
          <Link href="/admin/zones" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Zonas</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Configurar áreas geográficas y coordenadas.</p>
          </Link>

          {/* Vehículos */}
          <Link href="/admin/vehicles" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/>
                  <circle cx="8" cy="15" r="2"/>
                  <circle cx="16" cy="15" r="2"/>
                  <path d="M4 12h16"/>
                  <path d="M8 6v4"/>
                  <path d="M16 6v4"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Vehículos</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Administrar tipos de vehículos y su capacidad.</p>
          </Link>

          {/* Viajes Populares */}
          <Link href="/admin/popular-transfers" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center group-hover:bg-pink-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Viajes Populares</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Destinos destacados en la página de inicio.</p>
          </Link>

          {/* 👇 NUEVO: Generar Voucher */}
          <Link href="/admin/voucher" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Generar Voucher</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Crear voucher PDF manual para cobros en efectivo o externos.</p>
          </Link>

          {/* 👇 NUEVO: Gestión de Fotos */}
          <Link href="/admin/photos" className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Gestión de Fotos</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Administrar imágenes por sección (hero, galería, etc.).</p>
          </Link>
        </div>
      </div>

      {/* Payment Brick Modal */}
      {showBrick && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Pago con tarjeta</h2>
            <PaymentBrick
              amount={Number(transactionAmount)}
              onSubmit={handleAdminPayment}
            />
            <button
              onClick={() => setShowBrick(false)}
              className="mt-4 text-sm text-gray-500 underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
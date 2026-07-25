//components/CheckoutForm.tsx

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import PaymentBrick from "@/components/PaymentBrick";
import { motion, AnimatePresence } from "framer-motion";
import { buildBookingPayload } from "@/lib/buildBookingPayload";

type Vehicle = {
  name: string;
  capacity: string;
  image: string;
};

type Props = {
  vehicle: Vehicle;
  priceUSD: number | null;
  from: string;
  to: string;
  passengers: string;
  departureDate: string;
  returnDate: string;
  tripType: string;
  disableContinue?: boolean;
};

// Opciones de parada (ej. supermercado/farmacia camino al destino).
// 15 minutos van incluidos sin costo; cada tramo adicional tiene un
// cargo fijo. Si necesitas cambiar estos montos, es el único lugar
// donde están definidos.
const STOP_OPTIONS = [
  { value: "15", label: "15 minutes", fee: 0 },
  { value: "30", label: "30 minutes", fee: 10 },
  { value: "60", label: "1 hour", fee: 50 },
  { value: "90", label: "1 hour 30 minutes", fee: 100 },
  { value: "120", label: "2 hours", fee: 200 },
] as const;

export default function CheckoutForm({
  vehicle,
  priceUSD,
  from,
  to,
  passengers,
  departureDate,
  returnDate,
  tripType,
  disableContinue = false,
}: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    airline: "",
    flight: "",
    arrival: "",
    pickupTime: "",
    returnFlight: "",
    returnPickupTime: "",
    notes: "",
  });

  const [stopOption, setStopOption] = useState<string>("15");
  const [showPayment, setShowPayment] = useState(false);

  const selectedStop = useMemo(
    () => STOP_OPTIONS.find((o) => o.value === stopOption) ?? STOP_OPTIONS[0],
    [stopOption]
  );
  const stopFee = selectedStop.fee;
  const totalWithStop = priceUSD !== null ? priceUSD + stopFee : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePayment = useCallback(
    async (brickData: Record<string, any>) => {
      console.log("BRICK DATA:", brickData);

      if (priceUSD === null) {
        throw new Error("Price not available. Please refresh the page.");
      }

      const token = brickData.token ?? brickData.formData?.token;
      const payment_method_id =
        brickData.payment_method_id ?? brickData.formData?.payment_method_id;
      const issuer_id = brickData.issuer_id ?? brickData.formData?.issuer_id;
      const installments = brickData.installments ?? brickData.formData?.installments;

      if (!token || !payment_method_id) {
        throw new Error("Missing payment information from the brick");
      }

      const finalTotal = priceUSD + stopFee;

      // El costo de la parada se manda como additionalService, el mismo
      // campo que ya usa el flujo de admin para "servicios adicionales"
      // — mismo concepto (cargo extra sobre el transporte base), así
      // que reutilizarlo es consistente con el resto del sistema.
      //
      // ⚠️ Si buildBookingPayload no reconoce "additionalService" como
      // parámetro (TypeScript te lo va a decir clarísimo en el build,
      // igual que pasó con el campo "image" de Vehicle), avísame y
      // ajustamos el nombre exacto del campo.
      const bookingPayload = buildBookingPayload({
        transaction_amount: finalTotal,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        summary: tripType === "round" ? `${from} ↔ ${to}` : `${from} → ${to}`,
        pickupLocation: from,
        dropoffLocation: to,
        passengers,
        vehicleType: vehicle.name,
        pickupDate: departureDate,
        pickupTime: formData.pickupTime,
        roundTrip: tripType === "round",
        returnPickupLocation: tripType === "round" ? to : "",
        returnDropoffLocation: tripType === "round" ? from : "",
        returnPickupDate: tripType === "round" ? returnDate : "",
        returnPickupTime: tripType === "round" ? formData.returnPickupTime : "",
        returnFlight: tripType === "round" ? formData.returnFlight : "",
        airline: formData.airline,
        flight: formData.flight,
        arrival: formData.arrival,
        additionalService: stopFee,
        notes:
          stopFee > 0
            ? `Grocery/errand stop requested: ${selectedStop.label}.${
                formData.notes ? ` ${formData.notes}` : ""
              }`
            : formData.notes,
      });

      const payload = {
        ...bookingPayload,
        token,
        payment_method_id,
        issuer_id,
        installments: installments || 1,
        payer: brickData.formData?.payer,
      };

      const res = await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("PROCESS PAYMENT RESPONSE:", result);

      if (!res.ok) {
        throw new Error(result.error || "Payment failed");
      }

      if (result.status === "approved") {
        router.push(`/success?id=${result.id}`);
      }

      return result;
    },
    [
      formData,
      priceUSD,
      stopFee,
      selectedStop,
      vehicle.name,
      from,
      to,
      passengers,
      departureDate,
      returnDate,
      tripType,
      router,
    ]
  );

  const isContinueDisabled =
    priceUSD === null ||
    !formData.firstName ||
    !formData.email ||
    !formData.phone ||
    disableContinue;

  return (
    <div className="bg-white text-black p-6 rounded-3xl shadow space-y-6">
      <AnimatePresence mode="wait">
        {!showPayment ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold">Customer Information</h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="input-group">
                <input
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">First Name</label>
              </div>

              <div className="input-group">
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Last Name</label>
              </div>

              <div className="input-group col-span-2">
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Email</label>
              </div>

              <div className="input-group col-span-2">
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Phone</label>
              </div>

              <div className="input-group">
                <input
                  name="airline"
                  value={formData.airline}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Airline</label>
              </div>

              <div className="input-group">
                <input
                  name="flight"
                  value={formData.flight}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Flight Number</label>
              </div>

              <div className="input-group col-span-2">
                <input
                  type="time"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Pickup Time</label>
              </div>

              <div className="input-group col-span-2">
                <input
                  type="time"
                  name="arrival"
                  value={formData.arrival}
                  onChange={handleChange}
                  className="input-line peer"
                  placeholder=" "
                />
                <label className="label-line">Arrival Time</label>
              </div>

              {/* Customize your trip with stops */}
              <div className="col-span-2">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Customize your trip with stops
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Need to stop at a grocery store, pharmacy, or convenience
                  store on the way? Choose how much extra time to add.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STOP_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${
                        stopOption === opt.value
                          ? "border-[#4ccb8c] bg-[#4ccb8c]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="stopOption"
                          value={opt.value}
                          checked={stopOption === opt.value}
                          onChange={() => setStopOption(opt.value)}
                          className="accent-[#4ccb8c]"
                        />
                        <span className="text-sm text-gray-800">{opt.label}</span>
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          opt.fee === 0 ? "text-[#4ccb8c]" : "text-gray-500"
                        }`}
                      >
                        {opt.fee === 0 ? "Free" : `+$${opt.fee} USD`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Special Requests
                  </label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Baby seat, wheelchair, extra luggage, surfboards, etc."
                    className="w-full border rounded-lg p-3"
                  />
              </div>

              {tripType === "round" && (
                <>
                  <div className="col-span-2 mt-2">
                    <h3 className="font-semibold text-gray-700">
                      Return Transfer
                    </h3>
                  </div>

                  <div className="input-group">
                    <input
                      name="returnFlight"
                      value={formData.returnFlight}
                      onChange={handleChange}
                      className="input-line peer"
                      placeholder=" "
                    />
                    <label className="label-line">Return Flight Number</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="time"
                      name="returnPickupTime"
                      value={formData.returnPickupTime}
                      onChange={handleChange}
                      className="input-line peer"
                      placeholder=" "
                    />
                    <label className="label-line">Return Pickup Time</label>
                  </div>
                </>
              )}
            </div>

            {/* Desglose de precio: solo se muestra el detalle si hay un
                cargo por parada; si no, se ve igual que antes. */}
            <div className="space-y-1">
              {stopFee > 0 && (
                <>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Transport</span>
                    <span>{priceUSD === null ? "—" : `$${priceUSD} USD`}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Grocery stop ({selectedStop.label})</span>
                    <span>+${stopFee} USD</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-semibold pt-1">
                <span>Total</span>
                <span>
                  {priceUSD === null ? "Calculating..." : `$${totalWithStop} USD`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isContinueDisabled) {
                  alert(
                    priceUSD === null
                      ? "Price is still loading. Please wait."
                      : disableContinue
                      ? "Please complete your trip details above (date and address) before continuing."
                      : "Complete required fields"
                  );
                  return;
                }
                setShowPayment(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={isContinueDisabled}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PaymentBrick amount={totalWithStop ?? 0} onSubmit={handlePayment} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
//app/pay/Paycontent.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Image from "next/image";
import PaymentBrick from "@/components/PaymentBrick";
import { motion, AnimatePresence } from "framer-motion";
import type { BrickSubmitData } from "@/types/mercadopago";

// Traduce el status_detail de Mercado Pago a un mensaje entendible para el
// cliente. "default" cubre cualquier código que no esté en la lista.
const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount:
    "Your card was declined due to insufficient funds. Please try a different card.",
  cc_rejected_bad_filled_security_code:
    "The security code (CVV) you entered doesn't match. Please double-check it and try again.",
  cc_rejected_bad_filled_date:
    "The expiration date you entered doesn't match your card. Please double-check it and try again.",
  cc_rejected_bad_filled_other:
    "Some of your card details appear to be incorrect. Please double-check them and try again.",
  cc_rejected_call_for_authorize:
    "Your bank requires phone authorization for this charge. Please contact your bank, or try a different card.",
  cc_rejected_card_disabled:
    "This card isn't enabled for online payments. Please contact your bank, or try a different card.",
  cc_rejected_duplicated_payment:
    "This looks like a duplicate payment. If you already completed it, please check your email for confirmation before trying again.",
  cc_rejected_high_risk:
    "Your bank's fraud prevention system declined this payment. Please try a different card, or contact your bank.",
  cc_rejected_max_attempts:
    "You've reached the maximum number of attempts with this card. Please try a different card.",
  cc_rejected_blacklist:
    "This card can't be used for this payment. Please try a different card.",
  cc_rejected_card_type_not_allowed:
    "This card type isn't accepted for this payment. Please try a different card.",
  default:
    "Your payment couldn't be processed. Please double-check your card details, or try a different card.",
};

function getRejectionMessage(statusDetail?: string) {
  if (statusDetail && REJECTION_MESSAGES[statusDetail]) {
    return REJECTION_MESSAGES[statusDetail];
  }
  return REJECTION_MESSAGES.default;
}

export default function PayContent() {
  const params = useSearchParams();
  const router = useRouter();

  const transactionAmount = Number(params.get("transaction_amount") || 0);
  const summary = params.get("summary") || "Transportation Service";
  const firstNameParam = params.get("firstName") || "";
  const lastNameParam = params.get("lastName") || "";
  const emailParam = params.get("email") || "";
  const phoneParam = params.get("phone") || "";
  const pickupLocation = params.get("pickupLocation") || "";
  const dropoffLocation = params.get("dropoffLocation") || "";
  const passengers = params.get("passengers") || "";
  const vehicleType = params.get("vehicleType") || "";
  const pickupTime = params.get("pickupTime") || "";
  const pickupDate = params.get("pickupDate") || "";
  const roundTrip = params.get("roundTrip") === "true";
  const returnPickupLocation = params.get("returnPickupLocation") || "";
  const returnDropoffLocation = params.get("returnDropoffLocation") || "";
  const returnPickupTime = params.get("returnPickupTime") || "";
  const returnPickupDate = params.get("returnPickupDate") || "";
  const additionalService = Number(params.get("additionalService") || 0);

  const [firstName, setFirstName] = useState(firstNameParam);
  const [lastName, setLastName] = useState(lastNameParam);
  const [email, setEmail] = useState(emailParam);
  const [showPayment, setShowPayment] = useState(false);

  // Estado del rechazo: se muestra en la misma página en vez de mandar al
  // cliente a /error, para que pueda intentar con otra tarjeta sin perder
  // el flujo de pago.
  const [rejection, setRejection] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Cambia la "key" del PaymentBrick para forzar que se remonte limpio en
  // cada reintento (nuevo formulario de tarjeta, sin datos residuales).
  const [brickKey, setBrickKey] = useState(0);

  const handlePayment = useCallback(
  async (data: BrickSubmitData) => {
      console.log("PAYMENT DATA ENVIADO AL BACKEND:", data);
      setRejection(null);

      let res: Response;
      try {
        res = await fetch("/api/process-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            transaction_amount: transactionAmount,
            firstName,
            lastName,
            email,
            summary,
            phone: phoneParam,
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
            paidAmount: transactionAmount,
          }),
        });
      } catch (networkError) {
        // Error real de red/servidor: aquí sí tiene sentido mandar a /error,
        // porque no es un rechazo de tarjeta que el cliente pueda resolver
        // solo, sino una falla de nuestro lado.
        console.error("NETWORK ERROR:", networkError);
        router.push(`/error?type=network`);
        return;
      }

      const result = await res.json();
      console.log("BACKEND RESPONSE:", result);

      if (!res.ok) {
        // Error de validación/servidor (no un rechazo de tarjeta) — sigue
        // ameritando /error, ya que normalmente indica un problema de
        // configuración, no algo que el cliente resuelva con otra tarjeta.
        router.push(`/error?type=server`);
        return;
      }

      if (result.status === "approved") {
        const successParams = new URLSearchParams({
          transaction_amount: transactionAmount.toString(),
          firstName: firstName,
          lastName: lastName,
          email: email,
          vehicle: vehicleType,
          from: pickupLocation,
          to: dropoffLocation,
          passengers: passengers,
          pickupTime: pickupTime,
          pickupDate: pickupDate,
          phone: phoneParam,
          roundTrip: roundTrip.toString(),
        });

        if (roundTrip) {
          successParams.append("returnPickupLocation", returnPickupLocation);
          successParams.append("returnDropoffLocation", returnDropoffLocation);
          successParams.append("returnPickupTime", returnPickupTime);
          successParams.append("returnPickupDate", returnPickupDate);
        }

        router.push(`/success?${successParams.toString()}`);
      } else if (result.status === "pending" || result.status === "in_process") {
        router.push(
          `/success?status=pending&transaction_amount=${transactionAmount}&email=${encodeURIComponent(email)}`
        );
      } else if (result.status === "rejected") {
        // Rechazo de tarjeta: nos quedamos en la misma página, mostramos un
        // mensaje entendible y dejamos que el cliente intente con otra
        // tarjeta de inmediato, en vez de mandarlo a /error.
        setAttempts((a) => a + 1);
        setRejection(getRejectionMessage(result.status_detail));
        setBrickKey((k) => k + 1);
      } else {
        setAttempts((a) => a + 1);
        setRejection(getRejectionMessage(undefined));
        setBrickKey((k) => k + 1);
      }

      return result;
    },
    [
      transactionAmount,
      firstName,
      lastName,
      email,
      phoneParam,
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
      router,
      summary,
    ]
  );

  return (
    <div className="min-h-screen flex justify-center bg-[#f5f5f5] px-4 pt-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Image src="/images/logo-color.png" alt="logo" width={80} height={80} />
        </div>
        <h2 className="text-3xl font-semibold text-center text-black">
          Complete Payment
        </h2>
        <div className="border-2 border-[#4ccb8c] rounded-2xl p-4 text-black bg-white text-center">
          {summary}
        </div>

        <AnimatePresence mode="wait">
          {!showPayment ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border-1 border-transparent hover:border-black rounded-2xl px-4 py-3 bg-white text-black"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border-1 border-transparent hover:border-black rounded-2xl px-4 py-3 bg-white text-black"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-1 border-transparent hover:border-black rounded-2xl px-4 py-3 bg-white text-black"
              />
              <div className="flex justify-between items-center text-xl font-semibold text-black px-1">
                <span>Total</span>
                <span>${transactionAmount} USD</span>
              </div>
              <button
                onClick={() => {
                  if (!firstName || !lastName || !email) {
                    alert("Please complete first name, last name and email");
                    return;
                  }
                  setShowPayment(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full bg-[#2d6cdf] text-white py-4 rounded-2xl font-semibold shadow-md hover:opacity-90 transition"
              >
                Pay
              </button>

              <div className="flex gap-3 border-2 border-[#2d6cdf]/30 bg-[#2d6cdf]/5 rounded-2xl p-4">
                <span className="text-xl leading-none">🔒</span>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Please double-check your card number, expiration date, and
                  CVV before submitting. Make sure your card is enabled for
                  online and international purchases to avoid your bank
                  declining the charge.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >


              {/* Banner de rechazo: aparece solo después de un intento
                  fallido, sin sacar al cliente de esta página. */}
              {rejection && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-red-300 bg-red-50 rounded-2xl p-4"
                >
                  <p className="text-sm font-semibold text-red-700 mb-1">
                    Payment declined
                  </p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {rejection}
                  </p>
                  <p className="text-xs text-red-500 mt-2">
                    You can try again below with a different card.
                  </p>
                </motion.div>
              )}

              {attempts >= 3 && (
                <div className="border-2 border-amber-300 bg-amber-50 rounded-2xl p-4">
                  <p className="text-sm text-amber-700 leading-relaxed">
                    We noticed a few declined attempts. If the problem
                    continues, please contact your bank, or reach out to us
                    so we can help you complete this payment another way.
                  </p>
                </div>
              )}

              <PaymentBrick
                key={brickKey}
                amount={transactionAmount}
                onSubmit={handlePayment}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
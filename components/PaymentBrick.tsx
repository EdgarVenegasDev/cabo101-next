//components/PaymentBrick.tsx


"use client";

import { memo } from "react";
import { Payment } from "@mercadopago/sdk-react";
import type { BrickSubmitData } from "@/types/mercadopago";

type Props = {
  amount: number;
  onSubmit: (data: BrickSubmitData) => Promise<void>;
};

function PaymentBrickComponent({ amount, onSubmit }: Props) {
  const handleSubmit = async (data: BrickSubmitData) => {
    console.log("📦 Datos recibidos del brick:", data);

    // Extraer campos necesarios (pueden venir directamente o dentro de formData)
    const token = data.token ?? data.formData?.token;
    const payment_method_id = data.payment_method_id ?? data.formData?.payment_method_id;
    const issuer_id = data.issuer_id ?? data.formData?.issuer_id;
    const installments = data.installments ?? data.formData?.installments;
    const payer = data.payer ?? data.formData?.payer;

    // Validar que existan token y payment_method_id
    if (!token || !payment_method_id) {
      console.error("❌ Faltan token o payment_method_id en los datos del brick:", data);
      alert("No se recibió información de pago. Revisa la consola para más detalles.");
      return;
    }

    // Llamar al onSubmit con los datos normalizados
    await onSubmit({
      token,
      payment_method_id,
      issuer_id: issuer_id || undefined,
      installments: installments || 1,
      payer: payer || undefined,
      ...data,
    });
  };

  return (
    <Payment
      initialization={{ amount }}
      customization={{
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          ticket: "all",
        },
      }}
      onSubmit={handleSubmit}
      onError={(error) => {
        console.error("❌ Error en PaymentBrick:", error);
        alert("Error al procesar el pago: " + JSON.stringify(error));
      }}
      onReady={() => {
        console.log("✅ PaymentBrick listo");
      }}
    />
  );
}

export default memo(PaymentBrickComponent);
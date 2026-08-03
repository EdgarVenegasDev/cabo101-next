// app/api/process-payment/route.ts

import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { bookingConfirmationTemplate, BookingEmailData } from "@/lib/emailTemplates/bookingConfirmation";

export const dynamic = "force-dynamic";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("Missing MP_ACCESS_TOKEN environment variable");
}
if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const USD_TO_MXN_RATE = Number(process.env.USD_TO_MXN_RATE ?? 19.25);

export async function POST(req: Request) {
  try {
    console.log("PROCESS PAYMENT HIT");
    const body = await req.json();

    const data = body;
    data.email = data.email || data.payer?.email || "";

    console.log("DATOS RECIBIDOS:", {
      transaction_amount: data.transaction_amount,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      pickupLocation: data.pickupLocation,
      token: !!data.token,
      payment_method_id: data.payment_method_id,
    });

    if (!data.email) {
      return NextResponse.json({ error: "Customer email missing" }, { status: 400 });
    }

    // Validación opcional: al menos nombre o apellido
    if (!data.firstName && !data.lastName) {
      return NextResponse.json({ error: "Customer name missing (firstName or lastName)" }, { status: 400 });
    }

    const totalUSD = Number(data.transaction_amount);
    if (!Number.isFinite(totalUSD) || totalUSD <= 0) {
      return NextResponse.json({ error: "Invalid transaction amount (USD)" }, { status: 400 });
    }

    if (!data.token) {
      return NextResponse.json({ error: "Payment token missing" }, { status: 400 });
    }

    if (!data.payment_method_id) {
      return NextResponse.json({ error: "Payment method missing" }, { status: 400 });
    }

    const installments = Number(data.installments) > 0 ? Number(data.installments) : 1;
    const additionalService = Number(data.additionalService) || 0;
    const subtotal = Math.max(totalUSD - additionalService, 0);
    const paidAmount = Number(data.paidAmount) || totalUSD;
    const toPay = Math.max(totalUSD - paidAmount, 0);

    // Datos de la parada tipo "grocery stop" (opcional). stopMinutes solo
    // se guarda/muestra si de verdad hubo un cargo (>0) o si el cliente
    // vino del flujo nuevo de CheckoutForm que siempre manda estos
    // campos — por eso se valida que ambos existan como número.
    const stopMinutesRaw = Number(data.stopMinutes);
    const stopFeeUSDRaw = Number(data.stopFeeUSD);
    const hasStopInfo = Number.isFinite(stopMinutesRaw) && Number.isFinite(stopFeeUSDRaw);
    const stopMinutes = hasStopInfo ? stopMinutesRaw : null;
    const stopFeeUSD = hasStopInfo ? stopFeeUSDRaw : null;

    const totalMXN = Math.round(totalUSD * USD_TO_MXN_RATE);

    const payment = new Payment(mp);

    console.log("TOKEN:", data.token);
    console.log("PAYMENT METHOD:", data.payment_method_id);
    console.log("ISSUER:", data.issuer_id);
    console.log("PAYER:", JSON.stringify(data.payer, null, 2));
    console.log("AMOUNT:", totalMXN);

    const result = await payment.create({
      body: {
        transaction_amount: totalMXN,
        token: data.token,
        installments,
        payment_method_id: data.payment_method_id,
        issuer_id: data.issuer_id,
        description: data.description || data.summary || "Transportation Service",
        payer: data.payer,
        metadata: {
          ...data.metadata,
          booking: {
            ...(data.metadata?.booking || {}),
            totalUSD,
            exchangeRate: USD_TO_MXN_RATE,
          },
        },
        binary_mode: true,
      },
    });

    console.log("MP RESULT:", {
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      payment_method_id: result.payment_method_id,
      payment_type_id: result.payment_type_id,
    });

    if (result.status !== "approved") {
      console.warn(
        `⚠️ PAGO NO APROBADO — status=${result.status} status_detail=${result.status_detail} email=${data.email} payment_method=${data.payment_method_id}`
      );
    }

    if (result.status === "approved") {
      const folio = `#${result.id?.toString().slice(-6) || "000000"}`;

      console.log("RESERVA APROBADA:", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        amountUSD: totalUSD,
        amountMXN: totalMXN,
        pickup: data.pickupLocation,
        dropoff: data.dropoffLocation,
        serviceType: data.roundTrip ? "Round Trip" : "One way",
        paymentId: result.id,
        stopMinutes,
        stopFeeUSD,
      });

      const templateData: BookingEmailData = {
        pickupDate: data.pickupDate,
        id: result.id,
        roundTrip: data.roundTrip,

        name: [data.firstName, data.lastName].filter(Boolean).join(" "),
        phone: data.phone,
        email: data.email,

        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,

        passengers: data.passengers,
        vehicleType: data.vehicleType,

        pickupTime: data.pickupTime,

        airline: data.airline,
        flight: data.flight,
        arrival: data.arrival,

        returnPickupLocation: data.returnPickupLocation,
        returnDropoffLocation: data.returnDropoffLocation,
        returnPickupTime: data.returnPickupTime,
        returnPickupDate: data.returnPickupDate,
        returnFlight: data.returnFlight,

        subtotal,
        additionalService,
        stopMinutes: stopMinutes ?? undefined,
        stopFeeUSD: stopFeeUSD ?? undefined,
        total: totalUSD,
        paidAmount,
        toPay,
      };

      console.log("📧 EMAIL DATA (templateData):");
      console.log(JSON.stringify(templateData, null, 2));

      const booking = await prisma.booking.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,

          email: data.email,
          phone: data.phone,

          pickupLocation: data.pickupLocation,
          dropoffLocation: data.dropoffLocation,

          passengers: Number(data.passengers),
          vehicleType: data.vehicleType,

          pickupDate: data.pickupDate,
          pickupTime: data.pickupTime,

          roundTrip: Boolean(data.roundTrip),

          returnPickupLocation: data.returnPickupLocation,
          returnDropoffLocation: data.returnDropoffLocation,
          returnPickupDate: data.returnPickupDate,
          returnPickupTime: data.returnPickupTime,

          totalUSD,
          totalMXN,

          paymentStatus: "paid",
          tripStatus: "pending",

          airline: data.airline,
          flightNumber: data.flight,

          arrivalTime: data.arrival,

          returnFlightNumber: data.returnFlight,

          notes: data.notes,

          stopMinutes,
          stopFeeUSD,
        },
      });

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          mercadopagoId: String(result.id),
          status: String(result.status),
          totalUSD,
          totalMXN,
          exchangeRate: USD_TO_MXN_RATE,
        },
      });

      const html = bookingConfirmationTemplate(templateData);

      try {
        await resend.emails.send({
          from: "Cabo101 <no-reply@cabo101.com.mx>",
          to: data.email,
          subject: `Booking Confirmation - ${folio}`,
          html,
        });
        await resend.emails.send({
          from: "Cabo101 <no-reply@cabo101.com.mx>",
          to: "cabo101guide@gmail.com",
          subject: `New Booking - ${folio}`,
          html,
        });
      } catch (emailError) {
        console.error("EMAIL ERROR (no afecta el pago):", emailError);
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("FULL MP ERROR:");
    console.dir(error, { depth: null });

    const message = error instanceof Error ? error.message : "Unknown error";
    const cause = error instanceof Error ? error.cause : undefined;
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as { status?: number }).status
        : undefined;

    return NextResponse.json(
      { error: true, message, cause, status },
      { status: 500 }
    );
  }
}
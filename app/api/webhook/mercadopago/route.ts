//app/api/webhook/mercadopago/route.ts

import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  const body = await req.json();

  if (body.type === "payment") {
    const payment = new Payment(client);

    const dataPayment = await payment.get({
      id: body.data.id,
    });

    if (dataPayment.status === "approved") {
      const data = dataPayment.metadata;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // cliente
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: "Booking Confirmed 🚗",
        html: `<h2>Reserva confirmada</h2>`,
      });

      // admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: "Nueva reserva",
        html: `<h2>Nueva reserva</h2>`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
// app/api/contact/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

const resend = new Resend(process.env.RESEND_API_KEY);

function safe(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ACTIVITY_LABELS: Record<string, string> = {
  fishing: "Fishing",
  boats: "Boats & Yachts",
  tours: "Activities & Tours",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    const activity = String(body.activity || "");

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    const activityLabel = ACTIVITY_LABELS[activity] || "General inquiry";

    const internalHtml = `
      <div style="font-family:sans-serif; font-size:14px; color:#1f2937;">
        <h2 style="margin:0 0 12px;">New Experience Inquiry — ${safe(activityLabel)}</h2>
        <p><strong>Name:</strong> ${safe(name)}</p>
        <p><strong>Email:</strong> ${safe(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap; background:#f9fafb; padding:12px; border-radius:8px;">${safe(message)}</p>
      </div>
    `;

    const confirmationHtml = `
      <div style="font-family:sans-serif; font-size:14px; color:#1f2937;">
        <h2 style="margin:0 0 12px;">Thanks for reaching out, ${safe(name)}!</h2>
        <p>We received your message about <strong>${safe(activityLabel)}</strong> and one of our team members will get back to you shortly.</p>
        <p style="color:#6b7280; font-size:12px; margin-top:20px;">Cabo 101 · booking@cabo101.com.mx</p>
      </div>
    `;

    // Notificación interna al equipo
    await resend.emails.send({
      from: "Cabo101 <no-reply@cabo101.com.mx>",
      to: "abraham_venegaz@hotmail.com",
      subject: `New Experience Inquiry - ${activityLabel}`,
      html: internalHtml,
    });

    // Confirmación al cliente (si falla, no bloquea la respuesta —
    // igual que en process-payment, un error de correo no debe tumbar
    // la experiencia del usuario)
    try {
      await resend.emails.send({
        from: "Cabo101 <no-reply@cabo101.com.mx>",
        to: email,
        subject: "We received your message - Cabo 101",
        html: confirmationHtml,
      });
    } catch (confirmError) {
      console.error("No se pudo enviar la confirmación al cliente:", confirmError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong sending your message. Please try again." },
      { status: 500 }
    );
  }
}
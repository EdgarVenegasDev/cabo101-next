// lib/emailTemplates/bookingConfirmation.ts

function safe(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type BookingEmailData = {
  pickupDate?: string;
  id?: string | number;
  roundTrip?: boolean;

  name?: string;
  phone?: string;
  email?: string;

  pickupLocation?: string;
  dropoffLocation?: string;

  passengers?: string | number;
  vehicleType?: string;

  pickupTime?: string;

  airline?: string;
  flight?: string;
  arrival?: string;

  returnPickupLocation?: string;
  returnDropoffLocation?: string;
  returnPickupTime?: string;
  returnPickupDate?: string;
  returnFlight?: string;

  subtotal: number;
  additionalService: number;
  // Parada tipo "grocery stop": minutos elegidos y su cargo. Opcionales
  // porque una reserva armada desde el admin (sin pasar por
  // CheckoutForm) puede no tener esta información.
  stopMinutes?: number;
  stopFeeUSD?: number;
  total: number;
  paidAmount: number;
  toPay: number;
};

export function bookingConfirmationTemplate(data: BookingEmailData): string {
  const formatPrice = (value: number | undefined | null): string => {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : "0.00";
  };

  const field = (label: string, value: string) => `
    <span style="font-size:13px; color:#1f2937; font-weight:600; display:block; margin-bottom:3px;">${label}</span>
    <span style="font-size:13px; color:#374151;">${value}</span>
  `;

  // Solo se muestra si de verdad viene un stopMinutes definido (aunque
  // sea 15 minutos gratis) — así el cliente ve claramente que sí
  // registramos su preferencia de parada, no solo el monto extra.
  const hasStopInfo = typeof data.stopMinutes === "number";
  const stopLabel = (() => {
    switch (data.stopMinutes) {
      case 15: return "15 minutes";
      case 30: return "30 minutes";
      case 60: return "1 hour";
      case 90: return "1 hour 30 minutes";
      case 120: return "2 hours";
      default: return data.stopMinutes ? `${data.stopMinutes} minutes` : "";
    }
  })();

  return `
<div style="font-family:'Trebuchet MS', Tahoma, sans-serif; background:#f0f0f0; padding:20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:auto; background:white; border-radius:10px; overflow:hidden; border-collapse:collapse;">

  <!-- HEADER -->
  <tr>
    <td style="background:#d4f5e7; padding:28px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;">
            <h2 style="margin:0 0 10px; color:#1f2937; font-size:22px; font-weight:700; line-height:1.3;">
              Your Transfer <br/> Is Confirmed
              <img src="https://cabo101.com.mx/images/palomita.png" width="20" style="vertical-align:middle; margin-left:6px;"/>
            </h2>
            <p style="margin:0 0 28px; color:#374151; font-size:12px; line-height:1.6;">
              Thank you for choosing CABO 101. <br/>
              Our driver will be ready for you.
            </p>
          </td>
          <td style="width:110px; vertical-align:middle; text-align:right;">
            <img
              src="https://cabo101.com.mx/images/logo-correo.png"
              width="90"
              alt="Cabo 101 Logo"
              style="display:inline-block; border:0;"
            />
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HEADER DIAGONAL -->
  <tr>
    <td style="padding:0; line-height:0; font-size:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td width="35%" style="background:#d4f5e7; height:28px;"></td>
          <td width="65%" style="background:white; height:28px;"></td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- INFO GENERAL -->
  <tr>
    <td style="padding:22px 32px; border-bottom:1px solid #f0f0f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:33%; padding:0 8px 14px 0;">${field("Booking Date", safe(data.pickupDate))}</td>
          <td style="width:33%; padding:0 8px 14px;">${field("Folio", safe(data.id))}</td>
          <td style="width:33%; padding:0 0 14px;">${field("Service Type", data.roundTrip ? "Round Trip" : "One Way")}</td>
        </tr>
        <tr>
          <td style="padding:0 8px 0 0;">${field("Name", safe(data.name))}</td>
          <td style="padding:0 8px;">${field("Phone", safe(data.phone))}</td>
          <td style="padding:0;">${field("Email", safe(data.email))}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TRANSPORTATION SERVICE -->
  <tr>
    <td style="padding:22px 32px;">
      <h3 style="margin:0 0 12px; font-size:20px; font-weight:700; color:#1f2937;">Transportation Service</h3>
      <div style="border-top:2px solid #d1d5db; margin-bottom:18px;"></div>

      <!-- OUTBOUND -->
      <p style="font-size:12px; font-weight:700; color:#374151; margin:0 0 14px; letter-spacing:0.12em; padding-bottom:6px; border-bottom:2px solid #d1d5db; display:inline-block;">OUTBOUND</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:33%; padding:0 8px 14px 0;">${field("From", safe(data.pickupLocation))}</td>
          <td style="width:33%; padding:0 8px 14px;">${field("To", safe(data.dropoffLocation))}</td>
          <td style="width:33%; padding:0 0 14px;">${field("Passengers", safe(data.passengers))}</td>
        </tr>
        <tr>
          <td style="padding:0 8px 14px 0;">${field("Vehicle", safe(data.vehicleType))}</td>
          <td style="padding:0 8px 14px;">${field("Pick-up Time", safe(data.pickupTime))}</td>
          <td style="padding:0 0 14px;">${field("Date", safe(data.pickupDate))}</td>
        </tr>
        <tr>
          <td style="padding:0 8px 0 0;">${field("Airline", safe(data.airline))}</td>
          <td style="padding:0 8px;">${field("Flight", safe(data.flight))}</td>
          <td style="padding:0;">${field("Arrival Time", safe(data.arrival))}</td>
        </tr>
        ${hasStopInfo ? `
        <tr>
          <td style="padding:14px 8px 0 0;" colspan="3">${field("Stop Requested", `${stopLabel}${data.stopFeeUSD ? ` (+$${formatPrice(data.stopFeeUSD)} USD)` : " (Free)"}`)}</td>
        </tr>
        ` : ""}
      </table>

      ${data.roundTrip ? `
      <div style="height:22px;"></div>

      <!-- RETURN -->
      <p style="font-size:12px; font-weight:700; color:#374151; margin:0 0 14px; letter-spacing:0.12em; padding-bottom:6px; border-bottom:2px solid #d1d5db; display:inline-block;">RETURN</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:33%; padding:0 8px 14px 0;">${field("From", safe(data.returnPickupLocation))}</td>
          <td style="width:33%; padding:0 8px 14px;">${field("To", safe(data.returnDropoffLocation))}</td>
          <td style="width:33%; padding:0 0 14px;">${field("Passengers", safe(data.passengers))}</td>
        </tr>
        <tr>
          <td style="padding:0 8px 14px 0;">${field("Vehicle", safe(data.vehicleType))}</td>
          <td style="padding:0 8px 14px;">${field("Pick-up Time", safe(data.returnPickupTime))}</td>
          <td style="padding:0 0 14px;">${field("Date", safe(data.returnPickupDate))}</td>
        </tr>
        <tr>
          <td style="padding:0 8px 0 0;">${field("Return Flight", safe(data.returnFlight))}</td>
          <td style="padding:0 8px;">&nbsp;</td>
          <td style="padding:0;">&nbsp;</td>
        </tr>
      </table>
      ` : ""}
    </td>
  </tr>

  <!-- PRICE DETAILS -->
  <tr>
    <td style="padding:22px 32px; border-top:1px solid #f0f0f0;">
      <h3 style="margin:0 0 12px; font-size:20px; font-weight:700; color:#1f2937;">Price Details</h3>
      <div style="border-top:2px solid #d1d5db; margin-bottom:18px;"></div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; color:#374151; font-size:14px;">
        <tr>
          <td style="padding:7px 0;">Subtotal</td>
          <td align="right" style="padding:7px 0;">$${formatPrice(data.subtotal)} USD</td>
        </tr>
        <tr>
          <td style="padding:7px 0;">
            Additional Service${hasStopInfo ? ` (Stop: ${stopLabel})` : ""}
          </td>
          <td align="right" style="padding:7px 0;">$${formatPrice(data.additionalService)} USD</td>
        </tr>
        <tr>
          <td style="padding:9px 0 7px; border-top:1px solid #e5e7eb; font-weight:600;">Total</td>
          <td align="right" style="padding:9px 0 7px; border-top:1px solid #e5e7eb; font-weight:600;">$${formatPrice(data.total)} USD</td>
        </tr>
        <tr>
          <td style="padding:7px 0;">Paid Amount</td>
          <td align="right" style="padding:7px 0;">$${formatPrice(data.paidAmount)} USD</td>
        </tr>
        <tr>
          <td style="padding:10px 0 0; font-size:17px; font-weight:700; color:#1f2937;">To Pay</td>
          <td align="right" style="padding:10px 0 0; font-size:17px; font-weight:700; color:#059669;">$${formatPrice(data.toPay)} USD</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- IMPORTANT -->
  <tr>
    <td style="background:#fffbeb; padding:16px 32px; font-size:13px; color:#92400e; border-top:1px solid #fde68a; line-height:1.7;">
      <strong>Important:</strong> If applicable, please arrive at least 10 minutes early. A maximum wait time of 15 minutes after scheduled pickup is allowed. Changes or cancellations must be requested at least 8 hours in advance. Keep this email as your official receipt.
    </td>
  </tr>

  <!-- TERMS -->
  <tr>
    <td style="background:#f9fafb; padding:16px 32px; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; line-height:1.7;">
      <strong style="color:#374151;">Terms &amp; Conditions:</strong> This ticket is personal and non-transferable. Must be presented at boarding. Lost or damaged tickets may be considered invalid. Valid only for the date and time shown. Changes must be requested at least 8 hours in advance and are subject to availability. Cancellations must be made at least 8 hours in advance to qualify for a refund. Any damage caused inside the vehicle will result in additional charges. Cabo101 reserves the right to deny service to anyone posing a risk to others or the operation.
    </td>
  </tr>

  <!-- CONTACT -->
  <tr>
    <td style="background:#d4f5e7; padding:16px 32px; border-top:1px solid #c6f0db;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px; color:#065f46; font-weight:500; letter-spacing:0.03em;">
        <tr>
          <td style="text-align:left;">+52 (624) 320-98-77</td>
          <td style="text-align:center;">+52 (624) 174-63-53</td>
          <td style="text-align:right;">booking@cabo101.com.mx</td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</div>
`;
}
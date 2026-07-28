// components/FloatingContactButtons.tsx
"use client";

// Ajusta este número si no es el correcto — lo tomé del mismo que ya
// usas en el footer/voucher: +52 (624) 320-98-77. Formato sin espacios
// ni símbolos, con código de país, para que funcione con wa.me.
const WHATSAPP_NUMBER = "526243209877";
const SMS_NUMBER = "+526243209877";
const WHATSAPP_MESSAGE = "Hi! I'd like to book a transfer with Cabo 101.";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.27.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.2 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.26.13.43.19.5.3.07.11.07.63-.17 1.31Z" />
    </svg>
  );
}

function SmsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Solo se importa/renderiza en la página principal (ver instrucciones
// para app/page.tsx) — no en layout.tsx, para que no aparezca en
// /booking, /pay, /admin, etc.
export default function FloatingContactButtons() {
  return (
    <div
      className="fixed bottom-5 left-5 z-50 flex flex-col gap-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
      <a
        href={`sms:${SMS_NUMBER}`}
        aria-label="Send a text message"
        className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <SmsIcon className="w-6 h-6" />
      </a>
    </div>
  );
}
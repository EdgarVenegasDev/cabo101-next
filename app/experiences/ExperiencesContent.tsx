// app/experiences/ExperiencesContent.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";
import Reveal, { FadeIn } from "@/components/Reveal";

type Photo = {
  id: number;
  url: string;
  section: string;
  caption: string | null;
};

type MediaType = "image" | "gif" | "video";

type ActivityKey = "fishing" | "boats" | "tours";

// Descripciones fijas en código (no editables desde el admin por ahora
// — si quieres que lo sean, lo movemos a un campo editable). La media
// de cada actividad SÍ es dinámica, vía /admin/photos con las
// secciones "activity-fishing" / "activity-boats" / "activity-tours".
const ACTIVITIES: { key: ActivityKey; label: string; section: string; description: string }[] = [
  {
    key: "fishing",
    label: "Fishing",
    section: "activity-fishing",
    description:
      "Chase marlin, dorado, and tuna in the legendary waters where the Pacific meets the Sea of Cortez. Our experienced captains know exactly where the fish are biting, whether you're a first-timer or a seasoned angler.",
  },
  {
    key: "boats",
    label: "Boats & Yachts",
    section: "activity-boats",
    description:
      "Cruise past the iconic Arch of Cabo San Lucas aboard a private yacht or boat, with snorkeling stops, sunset views, and refreshments on board — perfect for celebrations or a relaxed day on the water.",
  },
  {
    key: "tours",
    label: "Activities & Tours",
    section: "activity-tours",
    description:
      "From ATV desert adventures to whale watching and city tours, discover the best of Los Cabos with a local guide by your side who knows every hidden gem.",
  },
];

function getMediaType(url: string): MediaType {
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.gif$/i.test(url)) return "gif";
  return "image";
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ className, direction = "right" }: { className?: string; direction?: "left" | "right" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={direction === "left" ? { transform: "scaleX(-1)" } : undefined}
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/* Miniatura del carrusel: imagen y GIF se muestran con <img> (el GIF
   se anima solo); el video muestra el primer frame, pausado, con un
   ícono de play encima — se reproduce completo al abrir el lightbox. */
function MediaThumb({ item, alt }: { item: Photo; alt: string }) {
  const type = getMediaType(item.url);
  if (type === "video") {
    return (
      <div className="relative w-full h-full">
        <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <PlayIcon className="w-4 h-4 text-gray-900 ml-0.5" />
          </div>
        </div>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt={alt} className="w-full h-full object-cover" />;
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-3 mb-16 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-square w-[45%] sm:w-[30%] md:w-[22%] flex-shrink-0 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

export default function ExperiencesContent() {
  const params = useSearchParams();
  const requestedActivity = params.get("activity") as ActivityKey | null;
  const [activeKey, setActiveKey] = useState<ActivityKey>(
    ACTIVITIES.some((a) => a.key === requestedActivity) ? (requestedActivity as ActivityKey) : "fishing"
  );

  const [heroVideoUrl, setHeroVideoUrl] = useState("/images/experience-preview.mp4");
  const [media, setMedia] = useState<Photo[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [lightboxItem, setLightboxItem] = useState<Photo | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const activeActivity = ACTIVITIES.find((a) => a.key === activeKey)!;

  // Video del hero: editable desde /admin/photos, sección "experiences-hero"
  useEffect(() => {
    fetch("/api/photos?section=experiences-hero")
      .then((res) => res.json())
      .then((data: Photo[]) => {
        const video = data.find((p) => getMediaType(p.url) === "video");
        if (video) setHeroVideoUrl(video.url);
      })
      .catch((err) => console.error("Error cargando hero de Experiences:", err));
  }, []);

  // Media (fotos, gifs y video) de la actividad seleccionada — todo
  // vive en un solo carrusel que cambia según la pestaña activa.
  useEffect(() => {
    let active = true;
    setLoadingMedia(true);
    fetch(`/api/photos?section=${activeActivity.section}`)
      .then((res) => res.json())
      .then((data: Photo[]) => {
        if (active) setMedia(data);
      })
      .catch((err) => console.error("Error cargando media de la actividad:", err))
      .finally(() => {
        if (active) setLoadingMedia(false);
      });
    return () => {
      active = false;
    };
  }, [activeActivity.section]);

  // Cerrar el lightbox con Escape
  useEffect(() => {
    if (!lightboxItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxItem(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxItem]);

  const scrollCarousel = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, activity: activeKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO con video de fondo */}
      <section className="relative min-h-[70vh] flex flex-col px-4 sm:px-6 md:px-10 lg:px-20 py-4 sm:py-6">
        <div className="absolute inset-0 -z-10">
          <video
            key={heroVideoUrl}
            src={heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={(e) => console.error("No se pudo cargar el video del hero:", heroVideoUrl, e)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Navbar />

        <div className="flex-1 flex flex-col justify-center max-w-4xl">
          <FadeIn>
            <p className="text-xs font-semibold tracking-widest uppercase text-teal-300 mb-3">
              Experiences
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              Live Los Cabos like a local
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Selector dinámico de actividad (solo 3 opciones) */}
      <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-10 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal className="flex flex-wrap justify-center gap-3 mb-10">
            {ACTIVITIES.map((activity) => (
              <button
                key={activity.key}
                onClick={() => setActiveKey(activity.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                  activeKey === activity.key
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {activity.label}
              </button>
            ))}
          </Reveal>

          {/* Todo lo que depende de la actividad activa se remonta con
              key={activeKey} para que el fade se dispare en cada cambio
              de pestaña, no solo la primera vez que entra en pantalla. */}
          <div key={activeKey}>
            {/* Descripción de la actividad */}
            <FadeIn>
              <p className="text-gray-600 leading-relaxed text-center max-w-2xl mx-auto mb-8">
                {activeActivity.description}
              </p>
            </FadeIn>

            {/* Carrusel de media: fotos, gifs y video, en el orden que
                venga del admin. Soporta swipe en móvil y flechas en
                desktop. */}
            {loadingMedia ? (
              <CarouselSkeleton />
            ) : (
              media.length > 0 && (
                <FadeIn delay={80} className="relative mb-16">
                  <button
                    onClick={() => scrollCarousel(-1)}
                    aria-label="Previous media"
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition"
                  >
                    <ChevronIcon className="w-5 h-5" direction="left" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(1)}
                    aria-label="Next media"
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition"
                  >
                    <ChevronIcon className="w-5 h-5" />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {media.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setLightboxItem(item)}
                        className="group relative aspect-square w-[45%] sm:w-[30%] md:w-[22%] flex-shrink-0 snap-center rounded-xl overflow-hidden bg-gray-100"
                        aria-label={`Expand: ${item.caption || activeActivity.label}`}
                      >
                        <MediaThumb item={item} alt={item.caption || activeActivity.label} />
                      </button>
                    ))}
                  </div>
                </FadeIn>
              )
            )}
          </div>

          {/* Formulario de contacto */}
          <Reveal className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Interested in {activeActivity.label}?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Leave us your details and we'll get back to you shortly.
            </p>

            {sent ? (
              <div className="bg-teal-50 border border-teal-100 text-teal-700 rounded-xl p-4 text-sm">
                Thanks! We received your message and will be in touch soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {sendError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                    {sendError}
                  </div>
                )}
                <input
                  required
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                />
                <input
                  required
                  type="email"
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                />
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your plans..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      {/* Lightbox: clic en un elemento de media lo muestra en grande,
          reproduciendo el video completo si aplica. */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            onClick={() => setLightboxItem(null)}
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
          {getMediaType(lightboxItem.url) === "video" ? (
            <video
              src={lightboxItem.url}
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full rounded-lg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxItem.url}
              alt={lightboxItem.caption || activeActivity.label}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          )}
        </div>
      )}

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}




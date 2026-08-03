// app/experiences/ExperiencesContent.tsx
"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
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

/* ---------- iconos de cada actividad — refuerzan qué representa cada
   pestaña del fichero, no son decoración ---------- */
function FishIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12s3.5-5 9-5 8 3 9 5c-1 2-3.5 5-9 5s-8-3-9-5z" />
      <path d="M19 9.5l2.5-2M19 14.5l2.5 2" />
      <circle cx="8.5" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AnchorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v13" />
      <path d="M5 12H2c0 4.5 4.5 8 10 8s10-3.5 10-8h-3" />
      <path d="M8 9l4 3 4-3" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 5-4 1 2-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronArrow({ className, direction = "right" }: { className?: string; direction?: "left" | "right" }) {
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

// Descripciones fijas en código (no editables desde el admin por ahora
// — si quieres que lo sean, lo movemos a un campo editable). La media
// de cada actividad SÍ es dinámica, vía /admin/photos con las
// secciones "activity-fishing" / "activity-boats" / "activity-tours".
const ACTIVITIES: {
  key: ActivityKey;
  label: string;
  section: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  {
    key: "fishing",
    label: "Act1",
    section: "activity-fishing",
    description:
      "Chase marlin, dorado, and tuna in the legendary waters where the Pacific meets the Sea of Cortez. Our experienced captains know exactly where the fish are biting, whether you're a first-timer or a seasoned angler.",
    Icon: FishIcon,
  },
  {
    key: "boats",
    label: "Act2",
    section: "activity-boats",
    description:
      "Cruise past the iconic Arch of Cabo San Lucas aboard a private yacht or boat, with snorkeling stops, sunset views, and refreshments on board — perfect for celebrations or a relaxed day on the water.",
    Icon: AnchorIcon,
  },
  {
    key: "tours",
    label: "Act3",
    section: "activity-tours",
    description:
      "From ATV desert adventures to whale watching and city tours, discover the best of Los Cabos with a local guide by your side who knows every hidden gem.",
    Icon: CompassIcon,
  },
];

function getMediaType(url: string): MediaType {
  if (/\.(mp4|webm|mov)$/i.test(url)) return "video";
  if (/\.gif$/i.test(url)) return "gif";
  return "image";
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
    <div className="flex gap-3 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="aspect-square w-[45%] sm:w-[30%] md:w-[22%] flex-shrink-0 rounded-xl bg-black/5 animate-pulse" />
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
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const activeIndex = ACTIVITIES.findIndex((a) => a.key === activeKey);
  const activeActivity = ACTIVITIES[activeIndex];

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

  // Al cargar la media de una actividad, arranca centrado en el
  // elemento de en medio en vez de en el primero:
  // [foto][foto][ FOTO ][foto][foto]
  //                ↑
  //           empieza aquí
  useEffect(() => {
    if (!carouselRef.current || media.length === 0) return;

    const middle = Math.floor(media.length / 2);

    itemRefs.current[middle]?.scrollIntoView({
      behavior: "instant",
      inline: "center",
      block: "nearest",
    });
  }, [media]);

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
      {/* ---------- HERO ---------- */}
      <section className="relative isolate min-h-[90vh] sm:min-h-[85vh] md:min-h-[80vh] flex flex-col px-4 sm:px-6 md:px-10 lg:px-20 py-4 sm:py-6">
        {/* Sin z-index negativo: "isolate" en la sección crea su propio
            contexto de apilamiento, así que este div se queda detrás
            del contenido de abajo sin arriesgarse a caer detrás de
            toda la página (el bug que causaba el fondo en blanco). */}
        <div className="absolute inset-0 z-0 bg-teal-900">
          <video
            key={heroVideoUrl}
            src={heroVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={(e) => console.error("No se pudo cargar el video del hero:", heroVideoUrl, e)}
            onLoadedData={() => console.log("Hero video cargado:", heroVideoUrl)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        <div className="relative z-10">
          <Navbar />
        </div>
      </section>

      {/* ---------- SELECTOR DE ACTIVIDADES — estilo fichero ---------- */}
      <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-10 lg:px-20">
        <Reveal className="max-w-5xl mx-auto">
          {/* Pestañas — la activa se eleva y se conecta con el cuerpo;
              las demás quedan detrás, como en un fichero real. */}
          <div className="flex items-end gap-1.5 sm:gap-2 px-1">
            {ACTIVITIES.map((activity, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={activity.key}
                  onClick={() => setActiveKey(activity.key)}
                  aria-pressed={isActive}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-t-2xl transition-all duration-300 ${
                    isActive
                      ? "bg-white text-gray-900 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20"
                      : "bg-gray-100 text-gray-400 py-3 translate-y-1 hover:bg-gray-200 hover:text-gray-600 z-10"
                  }`}
                >
                  <activity.Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isActive ? "text-teal-600" : ""}`} />
                  <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                    {activity.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cuerpo del fichero — blanco, con borde para separarse de
              la página (que también es blanca) ya que aquí no hay
              diferencia de color que lo haga por sí sola. */}
          <div className="bg-white border border-gray-100 rounded-b-2xl rounded-tr-2xl -mt-px shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 md:p-12">
            {/* Todo lo que depende de la actividad activa se remonta
                con key={activeKey} para que la animación se dispare en
                cada cambio, no solo la primera vez que entra en pantalla. */}
            <div key={activeKey}>
              <FadeIn className="mb-6">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-teal-600">
                  Now exploring — {activeActivity.label}
                </p>
              </FadeIn>

              {/* Carrusel de media: fotos, gifs y video, en el orden
                  que venga del admin. Soporta swipe en móvil y flechas
                  en desktop. Si la actividad no tiene media todavía,
                  se reserva el mismo espacio con un placeholder en vez
                  de colapsar el bloque — así el fólder no cambia de
                  alto al cambiar de pestaña y el contenido de abajo no
                  se recorre. */}
              {loadingMedia ? (
                <CarouselSkeleton />
              ) : media.length > 0 ? (
                <FadeIn delay={80} className="relative mb-8">
                  <button
                    onClick={() => scrollCarousel(-1)}
                    aria-label="Previous media"
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition"
                  >
                    <ChevronArrow className="w-5 h-5" direction="left" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(1)}
                    aria-label="Next media"
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-teal-600 hover:border-teal-300 transition"
                  >
                    <ChevronArrow className="w-5 h-5" />
                  </button>

                  <div
                    ref={carouselRef}
                    className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {media.map((item, index) => (
                      <button
                        key={item.id}
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        onClick={() => setLightboxItem(item)}
                        className="group relative aspect-square w-[45%] sm:w-[30%] md:w-[22%] flex-shrink-0 snap-center rounded-xl overflow-hidden bg-black/5"
                        aria-label={`Expand: ${item.caption || activeActivity.label}`}
                      >
                        <MediaThumb item={item} alt={item.caption || activeActivity.label} />
                      </button>
                    ))}
                  </div>
                </FadeIn>
              ) : (
                <div className="aspect-square w-[45%] sm:w-[30%] md:w-[22%] rounded-xl bg-black/5 flex items-center justify-center mb-8">
                  <p className="text-xs text-gray-400 text-center px-3">No photos yet</p>
                </div>
              )}

              {/* Descripción breve, dinámica por actividad — con una
                  altura mínima para que el cambio de una descripción
                  corta a una más larga no mueva tanto el contenido de
                  abajo. */}
              <FadeIn delay={140}>
                <p className="text-gray-600 leading-relaxed max-w-2xl min-h-[4.5rem]">
                  {activeActivity.description}
                </p>
              </FadeIn>
            </div>

            {/* ---------- FORMULARIO — ahora dentro del fichero.
                Vive fuera del div con key={activeKey} para no
                remontarse (ni perder su animación de entrada) cada
                vez que se cambia de actividad. ---------- */}
            <div className="mt-10 pt-10 border-t border-gray-100">
              <div className="max-w-xl mx-auto bg-gray-50 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Interested in {activeActivity.label}?
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Leave us your details and we&apos;ll get back to you shortly.
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
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- LIGHTBOX ---------- */}
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




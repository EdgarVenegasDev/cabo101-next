// app/experiences/ExperiencesContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";

type Photo = {
  id: number;
  url: string;
  section: string;
  caption: string | null;
};

type ActivityKey = "fishing" | "boats" | "tours";

// Descripciones fijas en código (no editables desde el admin por ahora
// — si quieres que lo sean, lo movemos a un campo editable). Las fotos
// y el video de cada actividad SÍ son dinámicos, vía /admin/photos con
// las secciones "activity-fishing" / "activity-boats" / "activity-tours".
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

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
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
        const video = data.find((p) => isVideoUrl(p.url));
        if (video) setHeroVideoUrl(video.url);
      })
      .catch((err) => console.error("Error cargando hero de Experiences:", err));
  }, []);

  // Media (video + fotos) de la actividad seleccionada
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

  const activityVideo = media.find((p) => isVideoUrl(p.url));
  const activityPhotos = media.filter((p) => !isVideoUrl(p.url));

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
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <Navbar />

        <div className="flex-1 flex flex-col justify-center max-w-4xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-300 mb-3">
            Experiences
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Live Los Cabos like a local
          </h1>
        </div>
      </section>

      {/* Selector dinámico de actividad (solo 3 opciones) */}
      <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-10 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
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
          </div>

          {/* Video de la actividad (si el admin subió uno) */}
          {activityVideo && (
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-video mb-8">
              <video
                key={activityVideo.url}
                src={activityVideo.url}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Descripción de la actividad */}
          <p className="text-gray-600 leading-relaxed text-center max-w-2xl mx-auto mb-10">
            {activeActivity.description}
          </p>

          {/* Fotos de la actividad */}
          {!loadingMedia && activityPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-16">
              {activityPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || activeActivity.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Formulario de contacto */}
          <div className="max-w-xl mx-auto bg-gray-50 rounded-2xl p-8">
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
          </div>
        </div>
      </section>

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}




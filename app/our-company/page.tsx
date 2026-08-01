// app/our-company/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";
import Reveal from "@/components/Reveal";

type Photo = {
  id: number;
  url: string;
  section: string;
  caption: string | null;
};

// Contenido decorativo fijo — no depende de la base de datos. Si más
// adelante quieres editarlo desde el admin, avísame y lo movemos a un
// campo de configuración.
const VALUES = [
  {
    title: "Family-Owned Business",
    description:
      "Cabo 101 was founded by a local family who wanted to share the best of Los Cabos with visitors from around the world.",
  },
  {
    title: "100% Mexican",
    description:
      "Proudly based in Los Cabos, run by Mexican hands, powered by Mexican hospitality.",
  },
  {
    title: "Trust & Reliability",
    description:
      "Licensed drivers, insured vehicles, and a team that treats every guest like family.",
  },
  {
    title: "Local Expertise",
    description:
      "We know Los Cabos inside and out — the best routes, the best spots, the best times to travel.",
  },
];

/* ---------- helper: trae la primera imagen de una sección del admin ---------- */
function useSectionImage(section: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/photos?section=${section}`)
      .then((res) => res.json())
      .then((data: Photo[]) => {
        if (active && data.length > 0) setUrl(data[0].url);
      })
      .catch((err) => console.error(`Error cargando imagen de ${section}:`, err));
    return () => {
      active = false;
    };
  }, [section]);

  return url;
}

/* ---------- fila de texto + imagen al lado, con reverse en desktop ---------- */
function StoryRow({
  eyebrow,
  title,
  text,
  imageSection,
  imageAlt,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  imageSection: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  const imageUrl = useSectionImage(imageSection);

  return (
    <div
      className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${
        reverse ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <Reveal delay={reverse ? 100 : 0}>
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-teal-600 to-teal-900 shadow-lg">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" />
          )}
        </div>
      </Reveal>

      <Reveal delay={reverse ? 0 : 100}>
        <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
          {eyebrow}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 leading-relaxed">{text}</p>
      </Reveal>
    </div>
  );
}

export default function OurCompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-teal-900 px-4 sm:px-6 md:px-10 lg:px-20 pt-4 pb-2">
        <Navbar />
      </div>

      <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-10 lg:px-20">
        <Reveal className="max-w-4xl mx-auto text-center mb-20">
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
            Our Company
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Descripcion Breve
          </h1>
        </Reveal>

        {/* Misión / Visión — texto con imagen al lado, alternando */}
        <div className="max-w-5xl mx-auto space-y-20 md:space-y-28 mb-24">
          <StoryRow
            eyebrow="Our Mission"
            title="Every arrival should feel effortless"
            text="To make every arrival and departure in Los Cabos feel effortless, safe, and welcoming — treating every guest like family from the moment they land."
            imageSection="company-mission"
            imageAlt="Cabo 101 team welcoming guests"
          />
          <StoryRow
            eyebrow="Our Vision"
            title="The most trusted name in Baja California Sur"
            text="To be the most trusted name in private transportation across Baja California Sur, known for reliability, warmth, and local knowledge."
            imageSection="company-vision"
            imageAlt="Cabo 101 vehicle on the road in Los Cabos"
            reverse
          />
        </div>

        {/* Valores / información decorativa — aparecen en cascada */}
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
              What sets us apart
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Our values</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-8">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 120}>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{v.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}
// app/our-company/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/sections/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";

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

export default function OurCompanyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-teal-900 px-4 sm:px-6 md:px-10 lg:px-20 pt-4 pb-2">
        <Navbar />
      </div>

      <section className="py-16 md:py-24 bg-white px-4 sm:px-6 md:px-10 lg:px-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
            Our Company
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Rooted in Los Cabos, driven by family values
          </h1>
        </div>

        {/* Misión / Visión */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To make every arrival and departure in Los Cabos feel effortless,
              safe, and welcoming — treating every guest like family from the
              moment they land.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To be the most trusted name in private transportation across
              Baja California Sur, known for reliability, warmth, and local
              knowledge.
            </p>
          </div>
        </div>

        {/* Valores / información decorativa */}
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-8">
          {VALUES.map((v) => (
            <div key={v.title} className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">{v.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <FloatingContactButtons />
    </div>
  );
}
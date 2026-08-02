"use client";

import InfiniteCarousel from "@/components/InfiniteCarousel";

const testimonials = [
  {
    name: "Sarah Mitchell",
    location: "California, USA",
    avatar: "/avatars/sarah.png",
    rating: 5,
    text: "Driver was waiting at arrivals with a sign. Car was spotless and cold. Best way to start a vacation — zero stress after a long flight.",
  },
  {
    name: "James Thornton",
    location: "London, UK",
    avatar: "/avatars/james.png",
    rating: 5,
    text: "We did the grocery stop on the way to our villa. Such a smart idea. The driver knew exactly which store and even helped carry the bags.",
  },
  {
    name: "Camille Dupont",
    location: "Paris, France",
    avatar: "/avatars/camille.png",
    rating: 5,
    text: "Punctual, professional, and the welcome drinks were a lovely touch. Already booked again for our next trip to Cabo.",
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-20 md:py-28 bg-gray-50 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto mb-10 text-center sm:text-left">
          {/* Mismo patrón de encabezado que Our Team / Popular Transfers:
              etiqueta pequeña + título, centrado en móvil, a la izquierda
              desde tablet/desktop. */}
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-600 mb-3">
            Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Rated Excellent by Our Travelers
          </h2>
        </div>
      </div>

      {/* Mismo carrusel que Our Team y Popular Transfers: scroll
          infinito, sin botones, se pausa al pasar el mouse. */}
      <InfiniteCarousel
        items={testimonials}
        itemKey={(t) => t.name}
        renderItem={(t) => (
          <div className="flex flex-col justify-between w-72 sm:w-80 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-500 p-6">
            <div>
              <Stars count={t.rating} />
              <p className="text-gray-600 text-sm leading-relaxed mt-4">
                &quot;{t.text}&quot;
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-gray-100"
                onError={(e) => {
                  if (!e.currentTarget.src.includes("placehold.co")) {
                    e.currentTarget.src = `https://placehold.co/64x64/0d9488/ffffff?text=${getInitials(t.name)}`;
                  }
                }}
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
              </div>
            </div>
          </div>
        )}
      />
    </section>
  );
}

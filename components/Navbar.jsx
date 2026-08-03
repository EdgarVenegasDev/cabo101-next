"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const WEATHER_LAT = 22.8905;
const WEATHER_LON = -109.9167;
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
  `&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min` +
  `&timezone=auto&forecast_days=7`;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function CloudIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function CloudSunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1M18.5 6.5l-.7.7M4.2 7.2l.7.7M3 13h1" />
      <circle cx="12" cy="9" r="3" />
      <path d="M16 20H7a4 4 0 1 1 .68-7.94A5 5 0 0 1 18 15a3 3 0 0 1-2 5z" />
    </svg>
  );
}

function CloudRainIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <path d="M8 20v2M12 20v2M16 20v2" />
    </svg>
  );
}

function CloudLightningIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10h-1.26A8 8 0 1 0 9 20h8a4.5 4.5 0 0 0 0-9z" />
      <path d="M13 13l-2 3h3l-2 3" />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function getWeatherInfo(code) {
  if (code === 0) return { label: "Clear", Icon: SunIcon };
  if (code === 1 || code === 2) return { label: "Partly cloudy", Icon: CloudSunIcon };
  if (code === 3 || code === 45 || code === 48) return { label: "Cloudy", Icon: CloudIcon };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: "Rain", Icon: CloudRainIcon };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", Icon: CloudIcon };
  if ([95, 96, 99].includes(code)) return { label: "Storm", Icon: CloudLightningIcon };
  return { label: "—", Icon: SunIcon };
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const navRef = useRef(null);

  const toggleMenu = (key) => {
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  const closeAll = () => {
    setIsOpen(false);
    setActiveMenu(null);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeMenu !== "weather") return;
    setWeatherLoading(true);
    setWeatherError(false);
    fetch(WEATHER_URL)
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch((err) => {
        console.error("Error cargando el clima:", err);
        setWeatherError(true);
      })
      .finally(() => setWeatherLoading(false));
  }, [activeMenu]);

  const currentWeather = weather?.current ? getWeatherInfo(weather.current.weather_code) : null;

  return (
    <div ref={navRef} className="relative z-50 flex justify-between items-center mb-12 text-white">

      {/* Logo */}
      <Link href="/" className="flex-shrink-0">
        <Image
          src="/images/logo3.png"
          alt="Cabo 101"
          width={45}
          height={45}
          className="object-contain"
        />
      </Link>

      {/* Botón de Hamburguesa */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 z-50 relative focus:outline-none min-[901px]:hidden"
        aria-label="Toggle Menu"
      >
        <span className={`h-0.5 w-6 bg-white rounded transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`h-0.5 w-6 bg-white rounded transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`} />
        <span className={`h-0.5 w-6 bg-white rounded transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-[2px] z-30 min-[901px]:hidden"
          onClick={closeAll}
        />
      )}

      {/* Barra Lateral / Nav */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[300px] bg-black/95 z-40 flex flex-col items-start justify-start pt-24 pl-10 pr-6 gap-6 text-lg overflow-y-auto transition-transform duration-300 ease-in-out

          min-[901px]:static min-[901px]:h-auto min-[901px]:w-auto min-[901px]:bg-transparent min-[901px]:flex-row min-[901px]:items-center min-[901px]:gap-16 min-[901px]:text-lg min-[901px]:mr-22 min-[901px]:pt-0 min-[901px]:pl-0 min-[901px]:pr-0 min-[901px]:overflow-visible min-[901px]:translate-x-0

          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <Link href="/" onClick={closeAll} className="hover:text-[#4ccb8c] transition">Home</Link>
        <Link href="/experiences" onClick={closeAll} className="hover:text-[#4ccb8c] transition">Experiences</Link>

        {/* About us (dropdown) */}
        <div className="relative w-full min-[901px]:w-auto">
          <button
            onClick={() => toggleMenu("about")}
            className="flex items-center gap-1.5 hover:text-[#4ccb8c] transition w-full min-[901px]:w-auto"
          >
            About us
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${activeMenu === "about" ? "rotate-180" : ""}`}
            />
          </button>
          {activeMenu === "about" && (
            <div className="mt-3 flex flex-col gap-3 pl-4 border-l border-white/20 min-[901px]:absolute min-[901px]:top-full min-[901px]:left-0 min-[901px]:mt-3 min-[901px]:pl-0 min-[901px]:border-l-0 min-[901px]:bg-black/95 min-[901px]:rounded-xl min-[901px]:p-4 min-[901px]:w-48 min-[901px]:shadow-xl">
              <Link href="/our-fleet" onClick={closeAll} className="text-base text-white/80 hover:text-[#4ccb8c] transition">Our Fleet</Link>
              <Link href="/our-company" onClick={closeAll} className="text-base text-white/80 hover:text-[#4ccb8c] transition">Our Company</Link>
            </div>
          )}
        </div>

        <a href="#" onClick={closeAll} className="hover:text-[#4ccb8c] transition">Contact</a>

        {/* Clima de Los Cabos */}
        <div className="relative w-full min-[901px]:w-auto">
          <button
            onClick={() => toggleMenu("weather")}
            className="flex items-center gap-2 hover:text-[#4ccb8c] transition"
            aria-label="Los Cabos weather"
          >
            <SunIcon className="w-5 h-5 flex-shrink-0" />
            <span className="min-[901px]:hidden">Weather</span>
          </button>

          {activeMenu === "weather" && (
            <div className="mt-3 w-full bg-white/5 border border-white/10 rounded-xl p-4 min-[901px]:absolute min-[901px]:top-full min-[901px]:right-0 min-[901px]:mt-3 min-[901px]:w-72 min-[901px]:bg-black/95 min-[901px]:shadow-xl">
              {weatherLoading && <p className="text-sm text-white/60">Loading forecast...</p>}
              {weatherError && (
                <p className="text-sm text-red-300">Couldn&apos;t load the weather right now.</p>
              )}
              {currentWeather && weather && (
                <>
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
                    <currentWeather.Icon className="w-8 h-8 text-[#4ccb8c] flex-shrink-0" />
                    <div>
                      <p className="text-2xl font-semibold leading-none">
                        {Math.round(weather.current.temperature_2m)}°C
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        {currentWeather.label} · Los Cabos
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {weather.daily?.time?.map((dateStr, idx) => {
                      const info = getWeatherInfo(weather.daily.weather_code[idx]);
                      const day = new Date(`${dateStr}T00:00:00`);
                      const label = idx === 0 ? "Today" : DAY_LABELS[day.getDay()];
                      return (
                        <div key={dateStr} className="flex items-center justify-between text-sm">
                          <span className="w-12 text-white/70 flex-shrink-0">{label}</span>
                          <info.Icon className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-white/40 text-xs flex-1 text-center truncate px-2">
                            {info.label}
                          </span>
                          <span className="text-white/90 flex-shrink-0">
                            {Math.round(weather.daily.temperature_2m_max[idx])}°
                            <span className="text-white/40">
                              {" "}/ {Math.round(weather.daily.temperature_2m_min[idx])}°
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
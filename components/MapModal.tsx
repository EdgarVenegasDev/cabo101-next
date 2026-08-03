//components/MapModal.jsx

"use client";

import { useEffect, useRef } from "react";

export type MapLocation = {
  lat: number;
  lng: number;
  address?: string;
  formattedAddress?: string;
};

type MapModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: MapLocation) => void;
};

export default function MapModal({ isOpen, onClose, onSelect }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current!, {
      center: { lat: 23.061, lng: -109.697 },
      zoom: 10,
    });

    let marker: google.maps.Marker | null = null;

    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const position = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      if (marker) marker.setMap(null);

      marker = new window.google.maps.Marker({
        position,
        map,
      });

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        onSelect({
          ...position,
          address: results[0].formatted_address,
        });
        onClose();
      }
    });
    });
  }, [isOpen, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[90%] max-w-3xl p-4">
        <div className="flex justify-between mb-3">
          <h2 className="font-semibold">Select location</h2>
          <button onClick={onClose}>✖</button>
        </div>
        <div ref={mapRef} className="w-full h-[400px] rounded-lg" />
      </div>
    </div>
  );
}
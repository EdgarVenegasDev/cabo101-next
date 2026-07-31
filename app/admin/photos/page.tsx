//app/admin/photos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import AdminHeader from "@/components/AdminHeader";

type Photo = {
  id: number;
  url: string;
  section: string;
  order: number;
  caption: string | null;
};

const SECTION_OPTIONS = [
  { value: "hero", label: "Hero (video)" },
  { value: "experience-video", label: "Experience Video" },
  { value: "experience-icons", label: "Experience Icons" },
  { value: "popular-transfers", label: "Popular Transfers" },
  { value: "testimonials-avatars", label: "Testimonials Avatars" },
  { value: "our-team", label: "Our Team (fotos y videos)" },
  { value: "experiences-hero", label: "Experiences: Hero (video)" },
  { value: "activity-fishing", label: "Experiences: Fishing" },
  { value: "activity-boats", label: "Experiences: Boats & Yachts" },
  { value: "activity-tours", label: "Experiences: Activities & Tours" },
  { value: "gallery", label: "Galería" },
];

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [section, setSection] = useState("hero");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterSection, setFilterSection] = useState("all");

  const loadPhotos = async () => {
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      setPhotos(data);
    } catch (err) {
      console.error("Error loading photos:", err);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!file) {
      alert("Selecciona un archivo");
      return;
    }

    console.log(`Subiendo archivo de ${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("section", section);
      if (caption) formData.append("caption", caption);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = uploadRes.headers.get("content-type") || "";
      let errorMessage = "Error desconocido";

      if (!uploadRes.ok) {
        if (uploadRes.status === 413) {
          setErrorMsg("El archivo es demasiado grande. El límite máximo es 100MB. Contacta al administrador.");
          setLoading(false);
          return;
        }

        try {
          const errorData = await uploadRes.json();
          errorMessage = errorData.error || "Error al subir el archivo";
        } catch (parseError) {
          const text = await uploadRes.text();
          errorMessage = `Error ${uploadRes.status}: ${text.substring(0, 100)}`;
        }
        setErrorMsg(errorMessage);
        setLoading(false);
        return;
      }

      const data = await uploadRes.json();

      const saveRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          section,
          caption,
        }),
      });

      if (!saveRes.ok) {
        const saveError = await saveRes.json();
        setErrorMsg(saveError.error || "Error al guardar en la base de datos");
        setLoading(false);
        return;
      }

      alert("✅ Archivo subido correctamente");
      setFile(null);
      setPreview(null);
      setCaption("");
      loadPhotos();
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Error inesperado al subir");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    loadPhotos();
  };

  const isVideo = file?.type.startsWith("video/");

  const filteredPhotos = useMemo(() => {
    if (filterSection === "all") return photos;
    return photos.filter((p) => p.section === filterSection);
  }, [photos, filterSection]);

  const sectionLabel = (value: string) =>
    SECTION_OPTIONS.find((s) => s.value === value)?.label || value;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader section="Fotos" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Multimedia</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sube imágenes y videos por sección del sitio.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Subir nuevo archivo</h2>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex flex-col gap-1 md:w-1/2">
              <label className="text-xs font-medium text-gray-500">Sección</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              >
                {SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Archivo (imagen o video)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              {preview && (
                <div className="mt-2">
                  {isVideo ? (
                    <video src={preview} controls className="max-h-48 rounded-lg" />
                  ) : (
                    <Image src={preview} alt="preview" width={200} height={150} className="object-cover rounded-lg" />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 md:w-1/2">
              <label className="text-xs font-medium text-gray-500">Pie de foto (opcional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {loading ? "Subiendo..." : "Subir"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-gray-900">
              Archivos ({filteredPhotos.length})
            </h2>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            >
              <option value="all">Todas las secciones</option>
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPhotos.map((photo) => (
                <div key={photo.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="relative h-48 w-full bg-gray-100">
                    {photo.url.match(/\.(mp4|webm|mov)$/) ? (
                      <video src={photo.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <Image src={photo.url} alt={photo.caption || "Foto"} fill className="object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <span className="inline-block text-[11px] bg-teal-50 text-teal-700 font-medium px-2 py-0.5 rounded-full border border-teal-100 mb-1">
                      {sectionLabel(photo.section)}
                    </span>
                    {photo.caption && <p className="text-sm text-gray-600">{photo.caption}</p>}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="mt-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 text-sm font-medium transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {filteredPhotos.length === 0 && (
              <p className="text-gray-400 text-center py-12">
                {photos.length === 0
                  ? "No hay archivos subidos"
                  : "Ningún archivo en esta sección todavía"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
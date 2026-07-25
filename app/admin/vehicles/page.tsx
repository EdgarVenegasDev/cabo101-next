//app/admin/vehicles/page.tsx

"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

interface Vehicle {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
  image?: string | null;
  annotations?: string | null;
}

type FormState = {
  name: string;
  capacity: string;
  active: boolean;
  image: string;
  annotations: string;
};

const emptyForm: FormState = { name: "", capacity: "", active: true, image: "", annotations: "" };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadVehicles = async () => {
    const res = await fetch("/api/vehicles");
    const data = await res.json();
    setVehicles(data);
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.capacity) {
      alert("Nombre y capacidad son obligatorios");
      return;
    }

    setLoading(true);
    try {
      let finalImage = form.image;

      if (imageFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("section", "vehicles");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        setUploading(false);

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          alert(errorData.error || "Error al subir la imagen");
          setLoading(false);
          return;
        }

        const uploadData = await uploadRes.json();
        finalImage = uploadData.url;
      }

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          capacity: parseInt(form.capacity),
          active: form.active,
          image: finalImage || null,
          annotations: form.annotations.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save vehicle");

      resetForm();
      loadVehicles();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      name: vehicle.name,
      capacity: String(vehicle.capacity),
      active: vehicle.active,
      image: vehicle.image || "",
      annotations: vehicle.annotations || "",
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm("Delete this vehicle? All associated prices will be lost.")) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      loadVehicles();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error(error);
      alert("Error deleting vehicle");
    }
  };

  // Lista de anotaciones (una por línea) para mostrar como pills en la
  // lista de vehículos de abajo.
  const parseAnnotations = (raw?: string | null) =>
    (raw || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader section="Vehículos" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipos de vehículo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra los vehículos disponibles, su capacidad, foto y anotaciones.
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            {editingId ? "Editar vehículo" : "Agregar vehículo"}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Nombre *</label>
              <input
                type="text"
                placeholder="e.g., SUV, VAN, SPRINTER"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Capacidad (pasajeros) *</label>
              <input
                type="number"
                placeholder="Max passengers"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-teal-600"
                />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
            </div>

            {/* Foto del vehículo */}
            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Foto del vehículo (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />

              {imagePreview ? (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Nueva foto:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : form.image ? (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Foto actual:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt="Foto actual"
                    className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              ) : null}
            </div>

            {/* Anotaciones libres */}
            <div className="md:col-span-3 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Anotaciones (una por línea)
              </label>
              <textarea
                rows={3}
                placeholder={"Direct ride - no stops\nDriver may not speak English"}
                value={form.annotations}
                onChange={(e) => setForm({ ...form, annotations: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition font-mono"
              />
              <span className="text-[11px] text-gray-400">
                Cada línea aparece como una etiqueta separada junto al vehículo en el paso de reserva.
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {uploading ? "Subiendo foto..." : loading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                disabled={loading}
                className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de vehículos */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              Vehículos ({vehicles.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {vehicles.map((vehicle) => {
              const annotations = parseAnnotations(vehicle.annotations);
              return (
                <div
                  key={vehicle.id}
                  className="flex justify-between items-start px-6 py-4 hover:bg-gray-50 transition gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {vehicle.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={vehicle.image}
                        alt={vehicle.name}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 flex-shrink-0 text-center px-1">
                        Sin foto
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{vehicle.name}</span>
                        {!vehicle.active && (
                          <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Capacidad: {vehicle.capacity} pasajeros</div>
                      {annotations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {annotations.map((note, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(vehicle)}
                      className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
            {vehicles.length === 0 && (
              <p className="text-center text-gray-400 py-12">
                No hay vehículos todavía. Crea uno arriba.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
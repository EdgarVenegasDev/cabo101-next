// app/experiences/page.tsx
"use client";

import { Suspense } from "react";
import ExperiencesContent from "./ExperiencesContent";

export default function ExperiencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ExperiencesContent />
    </Suspense>
  );
}
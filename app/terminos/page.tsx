"use client";

import { useEffect, useState } from "react";
import { getPublicLegalContent } from "@/lib/api";
import AppHeader from "@/components/AppHeader";

export default function TerminosPage() {
    const [info, setInfo] = useState<{ termsText: string; studioName: string; primaryColor: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const primaryColor = info?.primaryColor || "#53593D";

    useEffect(() => {
        getPublicLegalContent("TERMS_AND_CONDITIONS")
            .then(data => setInfo({ termsText: data.content, studioName: "Andes Pilates", primaryColor: "#53593D" }))
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <AppHeader title="Términos y Condiciones" primaryColor={primaryColor} />
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : !info?.termsText ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">
                            {info?.studioName ?? "El estudio"} aún no ha publicado sus términos y condiciones.
                        </p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                        {info.termsText}
                    </div>
                )}
            </main>
        </div>
    );
}
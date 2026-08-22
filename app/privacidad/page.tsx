"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicLegalContent } from "@/lib/api";

export default function PrivacidadPage() {
    const router = useRouter();
    const [info, setInfo] = useState<{ privacyText: string; studioName: string; primaryColor: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const primaryColor = info?.primaryColor || "#53593D";

    useEffect(() => {
        getPublicLegalContent("PRIVACY_POLICY")
            .then(data => setInfo({ privacyText: data.content, studioName: "Andes Pilates", primaryColor: "#53593D" }))
            .catch(() => { /* ignore */ })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-safe-top pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Política de Privacidad</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : !info?.privacyText ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-sm">
                            {info?.studioName ?? "El estudio"} aún no ha publicado su política de privacidad.
                        </p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                        {info.privacyText}
                    </div>
                )}
            </main>
        </div>
    );
}

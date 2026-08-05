"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface CompanyInfo {
    termsText: string;
    studioName: string;
    primaryColor: string;
}

export default function TerminosPage() {
    const router = useRouter();
    const [info, setInfo] = useState<CompanyInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const primaryColor = info?.primaryColor || "#6B7280";

    useEffect(() => {
        apiFetch<CompanyInfo>("/client/company")
            .then(setInfo)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Términos y Condiciones</h1>
            </header>
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
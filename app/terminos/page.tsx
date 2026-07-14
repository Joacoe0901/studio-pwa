"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface CompanyInfo {
    termsText: string;
    studioName: string;
}

export default function TerminosPage() {
    const router = useRouter();
    const [info, setInfo] = useState<CompanyInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<CompanyInfo>("/client/company")
            .then(setInfo)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="px-6 pt-10 pb-4 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-1 text-gray-500 text-xl">&larr;</button>
                <h1 className="text-xl font-bold">Términos y Condiciones</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pb-10 overflow-y-auto">
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
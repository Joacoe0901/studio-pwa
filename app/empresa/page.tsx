"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface StudioInfo {
    studioName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
    schedule: string;
    instagram: string;
    facebook: string;
    primaryColor: string;
}

export default function EmpresaPage() {
    const router = useRouter();
    const [info, setInfo] = useState<StudioInfo | null>(null);
    const primaryColor = info?.primaryColor || "#4A7C59";

    useEffect(() => {
        apiFetch<StudioInfo>("/settings")
            .then(setInfo)
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Empresa</h1>
            </header>
            <main className="flex-1 min-h-0 px-4 pb-10 pt-4 flex flex-col overflow-y-auto">
                {!info ? (
                    <p className="text-gray-400 text-sm">Cargando...</p>
                ) : (
                    <>
                    <div className="space-y-6 flex-1">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{info.studioName}</h2>
                            {info.description && (
                                <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                            )}
                        </div>

                        {info.address && (
                            <a
                                href={`https://maps.google.com/maps?q=${encodeURIComponent(info.address)}`}
                                target="_blank"
                                rel="noopener"
                                className="block rounded-xl overflow-hidden border border-gray-200 active:scale-[0.98] transition-transform"
                            >
                                <div className="relative w-full aspect-[16/9]">
                                    <img
                                        src="/ubicacion.png"
                                        alt="Ubicación del estudio"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-3 right-3">
                                        <span className="bg-white/90 text-xs font-medium text-gray-800 px-3 py-1.5 rounded-full shadow-sm">
                                            📍 Ver en Google Maps
                                        </span>
                                    </div>
                                </div>
                            </a>
                        )}

                        <div className="space-y-3">
                            {info.address && (
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-400 mt-0.5">📍</span>
                                    <p className="text-sm text-gray-700">{info.address}</p>
                                </div>
                            )}
                            {info.phone && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">📞</span>
                                    <a href={`tel:${info.phone}`} className="text-sm text-brand-600">{info.phone}</a>
                                </div>
                            )}
                            {info.email && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">✉️</span>
                                    <a href={`mailto:${info.email}`} className="text-sm text-brand-600">{info.email}</a>
                                </div>
                            )}
                            {info.website && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">🌐</span>
                                    <a href={info.website} target="_blank" rel="noopener" className="text-sm text-brand-600">{info.website}</a>
                                </div>
                            )}
                        </div>

                        {info.schedule && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Horario</p>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{info.schedule}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center gap-6 pt-6">
                        {info.instagram && (
                            <a
                                href={`https://instagram.com/${info.instagram.replace("@", "")}`}
                                target="_blank"
                                rel="noopener"
                                className="transition-opacity hover:opacity-80"
                            >
                                <img src="/logo_insta.png" alt="Instagram" className="w-10 h-10 object-contain" />
                            </a>
                        )}
                        {info.facebook && (
                            <a
                                href={`https://facebook.com/${info.facebook}`}
                                target="_blank"
                                rel="noopener"
                                className="transition-opacity hover:opacity-80"
                            >
                                <img src="/logo_face.png" alt="Facebook" className="w-10 h-10 object-contain" />
                            </a>
                        )}
                    </div>
                    </>
                )}
            </main>
        </div>
    );
}
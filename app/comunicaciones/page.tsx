"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPublicLegalContent, recordAcceptance } from "@/lib/api";

export default function ComunicacionesPage() {
    const router = useRouter();
    const [info, setInfo] = useState<{
        content: string;
        versionId: number;
        studioName: string;
        primaryColor: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false);
    const [saving, setSaving] = useState(false);
    const primaryColor = info?.primaryColor || "#53593D";

    useEffect(() => {
        async function load() {
            try {
                const data = await getPublicLegalContent("MARKETING_COMMUNICATIONS");
                setInfo({
                    content: data.content,
                    versionId: data.versionId ?? 0,
                    studioName: "Andes Pilates",
                    primaryColor: "#53593D",
                });
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleToggleMarketing(checked: boolean) {
        if (!info?.versionId) return;
        setAccepted(checked);
        setSaving(true);
        try {
            await recordAcceptance(info.versionId, checked);
        } catch {
            // revert on error
            setAccepted(!checked);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header
                className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3"
                style={{ backgroundColor: primaryColor }}
            >
                <button
                    onClick={() => router.back()}
                    className="p-1 text-white/80 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Comunicaciones de Marketing</h1>
            </header>
            <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
                <div className="flex-1 px-6 pt-4 pb-6">
                    {loading ? (
                        <p className="text-gray-400 text-sm">Cargando...</p>
                    ) : !info?.content ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">
                                {info?.studioName ?? "El estudio"} aún no ha publicado su política de
                                comunicaciones de marketing.
                            </p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                            {info.content}
                        </div>
                    )}
                </div>

                {/* Marketing acceptance checkbox — at the bottom */}
                {!loading && info?.versionId && info.versionId > 0 && (
                    <div className="flex-shrink-0 border-t border-gray-100 px-6 pt-5 pb-8 bg-gray-50">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={accepted}
                                disabled={saving}
                                onChange={(e) => handleToggleMarketing(e.target.checked)}
                                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700 leading-snug">
                                Acepto recibir comunicaciones de marketing
                            </span>
                        </label>
                        {saving && (
                            <p className="text-xs text-gray-400 mt-2 ml-8">Guardando...</p>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
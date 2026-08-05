"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";

interface ScheduleSlot {
    dayOfWeek: string;
    timeStart: string;
    timeEnd: string;
    serviceName: string;
}

/** Normaliza el nombre del día (inglés o español) a español canónico. */
const DAY_ES: Record<string, string> = {
    monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
    thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
    lunes: "Lunes", martes: "Martes", miércoles: "Miércoles", miercoles: "Miércoles",
    jueves: "Jueves", viernes: "Viernes", sábado: "Sábado", sabado: "Sábado", domingo: "Domingo",
};

function toSpanishDay(raw: string): string {
    const key = raw.trim().toLowerCase();
    return DAY_ES[key] ?? raw.trim();
}

const DAY_ORDER: Record<string, number> = {
    Lunes: 1, Martes: 2, Miércoles: 3,
    Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7,
};

export default function HorariosPage() {
    const router = useRouter();
    const [slots, setSlots] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#53593D");

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        apiFetch<ScheduleSlot[]>("/client/schedule")
            .then(setSlots)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [router]);

    const grouped: Record<string, ScheduleSlot[]> = {};
    for (const s of slots) {
        const day = toSpanishDay(s.dayOfWeek);
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(s);
    }

    const sortedDays = Object.keys(grouped).sort(
        (a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99)
    );

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Horarios</h1>
            </header>
            <main className="flex-1 min-h-0 px-6 pt-4 pb-10 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-400 text-sm">Cargando horarios...</p>
                ) : sortedDays.length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay horarios disponibles.</p>
                ) : (
                    <div className="space-y-6">
                        {sortedDays.map((day) => (
                            <div key={day}>
                                <h2 className="text-sm font-semibold text-gray-900 mb-2">{day}</h2>
                                <div className="space-y-2">
                                    {grouped[day].map((s, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                                        >
                                            <span className="text-sm font-medium text-gray-800">{s.serviceName}</span>
                                            <span className="text-sm text-gray-500">
                                                {s.timeStart} – {s.timeEnd}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
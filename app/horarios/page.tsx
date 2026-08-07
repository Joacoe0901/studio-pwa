"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getAccessToken } from "@/lib/api";

interface ScheduleSlot {
    dayOfWeek: string;
    timeStart: string;
    timeEnd: string;
    serviceName: string;
    instructor: string;
    color: string;
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

const DAY_SHORT: Record<string, string> = {
    Lunes: "L", Martes: "M", Miércoles: "X",
    Jueves: "J", Viernes: "V", Sábado: "S", Domingo: "D",
};

/** Calcula la duración en minutos entre dos horas "HH:MM". */
function durationMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
}

/** Formatea duración en minutos a texto legible. */
function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

/** Aclara un hex color mezclándolo con blanco (factor 0→original, 1→blanco). */
function lightenHex(hex: string, factor: number): string {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const lr = Math.round(r + (255 - r) * factor);
    const lg = Math.round(g + (255 - g) * factor);
    const lb = Math.round(b + (255 - b) * factor);
    return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export default function HorariosPage() {
    const router = useRouter();
    const [slots, setSlots] = useState<ScheduleSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [primaryColor, setPrimaryColor] = useState("#53593D");
    const [selectedDay, setSelectedDay] = useState<string>("");

    useEffect(() => {
        apiFetch<{ primaryColor: string }>("/client/company")
            .then((d) => setPrimaryColor(d.primaryColor || "#53593D"))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!getAccessToken()) { router.replace("/login"); return; }
        apiFetch<ScheduleSlot[]>("/client/schedule")
            .then((data) => {
                // Sort slots by timeStart within received order (API already sorts by DOW)
                const sorted = [...data].sort((a, b) => a.timeStart.localeCompare(b.timeStart));
                setSlots(sorted);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [router]);

    /* ─── Agrupar por día y ordenar slots dentro de cada día ─────────────── */
    const { grouped, sortedDays } = useMemo(() => {
        const g: Record<string, ScheduleSlot[]> = {};
        for (const s of slots) {
            const day = toSpanishDay(s.dayOfWeek);
            if (!g[day]) g[day] = [];
            g[day].push(s);
        }
        // Sort slots within each day by timeStart
        for (const day of Object.keys(g)) {
            g[day].sort((a, b) => a.timeStart.localeCompare(b.timeStart));
        }
        const days = Object.keys(g).sort(
            (a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99)
        );
        return { grouped: g, sortedDays: days };
    }, [slots]);

    /* ─── Autoseleccionar primer día ────────────────────────────────────── */
    useEffect(() => {
        if (sortedDays.length > 0 && !selectedDay) {
            setSelectedDay(sortedDays[0]);
        } else if (sortedDays.length > 0 && !sortedDays.includes(selectedDay)) {
            setSelectedDay(sortedDays[0]);
        }
    }, [sortedDays, selectedDay]);

    const daySlots = selectedDay ? grouped[selectedDay] ?? [] : [];

    /* ─── Encontrar la duración máxima del día para la barra proporcional ─ */
    const maxDuration = useMemo(() => {
        if (daySlots.length === 0) return 60;
        return Math.max(...daySlots.map((s) => durationMinutes(s.timeStart, s.timeEnd)));
    }, [daySlots]);

    const lightColor = useMemo(() => lightenHex(primaryColor, 0.82), [primaryColor]);

    return (
        <div className="h-dvh bg-white flex flex-col overflow-hidden">
            {/* ─── Header ──────────────────────────────────────────────── */}
            <header className="flex-shrink-0 px-4 pt-10 pb-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <button onClick={() => router.back()} className="p-1 text-white/80 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-white">Horarios</h1>
            </header>

            {/* ─── Day Selector Pills ──────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100">
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-hide">
                    {sortedDays.map((day) => {
                        const isSelected = day === selectedDay;
                        const short = DAY_SHORT[day] ?? day.charAt(0);
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-xl transition-all duration-200 active:scale-95"
                                style={{
                                    backgroundColor: isSelected ? primaryColor : "#F3F4F6",
                                    color: isSelected ? "#FFFFFF" : "#6B7280",
                                }}
                            >
                                <span className="text-[10px] font-medium leading-none opacity-70">
                                    {short}
                                </span>
                                <span className="text-lg font-bold leading-tight mt-1">
                                    {short}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* ─── Timeline Content ────────────────────────────────────── */}
            <main className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }} />
                        <p className="text-gray-400 text-sm">Cargando horarios...</p>
                    </div>
                ) : sortedDays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <p className="text-gray-400 text-sm">No hay horarios disponibles.</p>
                    </div>
                ) : daySlots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="text-gray-400 text-sm">Sin clases el {selectedDay}.</p>
                    </div>
                ) : (
                    <div className="px-4 py-4 space-y-5">
                        {/* Day header */}
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-bold text-gray-900">{selectedDay}</h2>
                            <div className="h-px flex-1 rounded-full" style={{ backgroundColor: lightColor }} />
                            <span className="text-xs text-gray-400">{daySlots.length} {daySlots.length === 1 ? "clase" : "clases"}</span>
                        </div>

                        {/* Timeline */}
                        <div className="relative pl-8">
                            {/* Vertical line */}
                            <div className="absolute left-[14px] top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: lightColor }} />

                            <div className="space-y-6">
                                {daySlots.map((s, i) => {
                                    const dur = durationMinutes(s.timeStart, s.timeEnd);
                                    const barWidth = Math.max((dur / maxDuration) * 100, 15);
                                    const slotColor = s.color || primaryColor;

                                    return (
                                        <div key={i} className="relative">
                                            {/* Timeline dot */}
                                            <div className="absolute left-[-29px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: slotColor }} />

                                            {/* Time label */}
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-sm font-bold text-gray-900">{s.timeStart}</span>
                                                <span className="text-xs text-gray-400">→ {s.timeEnd}</span>
                                                <span className="text-[11px] text-gray-400 ml-auto">{formatDuration(dur)}</span>
                                            </div>

                                            {/* Class card */}
                                            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex">
                                                    <div
                                                        className="flex-shrink-0 w-1 self-stretch rounded-l-xl"
                                                        style={{ backgroundColor: slotColor }}
                                                    />
                                                    <div className="flex-1 px-4 py-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                                                    {s.serviceName}
                                                                </p>
                                                                {s.instructor && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                                        con {s.instructor}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 mt-1">
                                                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: lightColor }}>
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${barWidth}%`,
                                                                            backgroundColor: slotColor,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                )}
            </main>
        </div>
    );
}